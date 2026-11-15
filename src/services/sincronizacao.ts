import { ErroApi } from '@/services/api';
import { chamarApi } from '@/services/api-app';
import { storage } from '@/services/storage';

/**
 * Fila de sincronizacao com a API (o padrao "offline first").
 *
 * A lista e o historico mudam primeiro no aparelho, na hora, e so depois vao
 * para o servidor. Cada mudanca vira uma operacao (PUT ou DELETE) guardada
 * nesta fila, no AsyncStorage. A fila e enviada em ordem, uma operacao por
 * vez; sem internet, ela espera e e enviada quando a conexao voltar, mesmo
 * que o aplicativo tenha sido fechado no meio.
 *
 * Operacoes com a mesma chave se substituem: se o player grava o progresso
 * do episodio 3 dez vezes sem internet, so a ultima gravacao fica na fila.
 */

export interface Operacao {
  /** O que a operacao altera. Uma operacao nova com a mesma chave substitui a antiga. */
  chave: string;
  metodo: 'PUT' | 'DELETE';
  caminho: string;
  corpo?: unknown;
}

interface OperacaoNaFila extends Operacao {
  id: string;
}

const PREFIXO = 'fila:';

function chaveDaFila(dono: string): string {
  return PREFIXO + dono;
}

let contador = 0;
function novoId(): string {
  contador += 1;
  return `${Date.now()}-${contador}`;
}

/**
 * Leitura e escrita da fila passam por esta trava, uma de cada vez. Sem ela,
 * duas mudancas seguidas poderiam ler a mesma fila e a segunda gravacao
 * apagaria a primeira.
 */
let trava: Promise<unknown> = Promise.resolve();
function emOrdem<T>(tarefa: () => Promise<T>): Promise<T> {
  const resultado = trava.then(tarefa);
  trava = resultado.catch(() => undefined);
  return resultado;
}

function lerFila(dono: string): Promise<OperacaoNaFila[]> {
  return storage.get<OperacaoNaFila[]>(chaveDaFila(dono), []);
}

/**
 * Coloca uma operacao no fim da fila.
 *
 * A funcao descarta, se informada, tira da fila operacoes que a nova torna
 * inuteis (limpar o historico descarta os PUTs de progresso pendentes).
 */
export function enfileirar(
  dono: string,
  operacao: Operacao,
  descarta?: (pendente: Operacao) => boolean,
): Promise<void> {
  return emOrdem(async () => {
    const fila = await lerFila(dono);
    const restantes = fila.filter(
      (pendente) => pendente.chave !== operacao.chave && !descarta?.(pendente),
    );
    await storage.set(chaveDaFila(dono), [...restantes, { ...operacao, id: novoId() }]);
  });
}

function retirar(dono: string, id: string): Promise<void> {
  return emOrdem(async () => {
    const fila = await lerFila(dono);
    await storage.set(
      chaveDaFila(dono),
      fila.filter((pendente) => pendente.id !== id),
    );
  });
}

export async function temPendentes(dono: string): Promise<boolean> {
  return (await lerFila(dono)).length > 0;
}

/**
 * Erro em que repetir nao adianta: a API recusou o pedido em si (dado
 * invalido, lista cheia). A operacao sai da fila para nao travar as outras.
 * Sem rede (0), sessao (401), limite (429) e falha do servidor (5xx) ficam
 * para a proxima tentativa.
 */
function recusaDefinitiva(erro: unknown): boolean {
  return (
    erro instanceof ErroApi &&
    erro.status >= 400 &&
    erro.status < 500 &&
    erro.status !== 401 &&
    erro.status !== 408 &&
    erro.status !== 429
  );
}

const enviosEmCurso = new Map<string, Promise<void>>();

/**
 * Envia a fila do usuario, em ordem. Se ja houver um envio em curso, devolve
 * o mesmo (dois envios ao mesmo tempo mandariam a mesma operacao duas vezes).
 */
export function enviarPendentes(dono: string): Promise<void> {
  const emCurso = enviosEmCurso.get(dono);
  if (emCurso) {
    return emCurso;
  }

  const envio = (async () => {
    for (;;) {
      const [proxima] = await lerFila(dono);
      if (!proxima) {
        return;
      }
      try {
        await chamarApi<unknown>(proxima.caminho, {
          method: proxima.metodo,
          body: proxima.corpo === undefined ? undefined : JSON.stringify(proxima.corpo),
        });
      } catch (erro) {
        if (!recusaDefinitiva(erro)) {
          return;
        }
      }
      await retirar(dono, proxima.id);
    }
  })().finally(() => enviosEmCurso.delete(dono));

  enviosEmCurso.set(dono, envio);
  return envio;
}

/**
 * Envia o que esta pendente e, se a fila esvaziou, baixa a versao do
 * servidor. Devolve null quando nao deu para sincronizar (sem internet, ou
 * mudancas novas chegaram durante o download): nesse caso o aparelho
 * continua com a copia local, que e a mais nova.
 */
export async function baixarSincronizado<T>(dono: string, caminho: string): Promise<T | null> {
  try {
    await enviarPendentes(dono);
    if (await temPendentes(dono)) {
      return null;
    }
    const dados = await chamarApi<T>(caminho);
    return (await temPendentes(dono)) ? null : dados;
  } catch {
    return null;
  }
}
