import { ErroApi, requisitar } from '@/services/api';
import { renovarTokens, URL_API_APP, type Tokens } from '@/services/autenticacao';

/**
 * Cliente da API do aplicativo para as rotas que exigem login.
 *
 * Toda chamada leva o token de acesso no cabecalho Authorization. Esse token
 * vale poucos minutos; quando a API responde 401, o cliente troca o token de
 * renovacao por um par novo e repete o pedido uma vez, sem a tela perceber.
 * Se a renovacao tambem for recusada (sessao encerrada ou vencida), avisa o
 * contexto de sessao, que leva o usuario de volta ao login.
 *
 * Os tokens ficam aqui, em memoria, enquanto o aplicativo esta aberto; a
 * copia que sobrevive ao fechamento fica no SecureStore, gravada pelo
 * contexto de sessao.
 */

interface Ouvintes {
  /** Chamado com o par novo depois de cada renovacao, para gravar no cofre. */
  aoRenovar: (tokens: Tokens) => void;
  /** Chamado quando a sessao nao tem mais como ser renovada. */
  aoExpirar: () => void;
}

let tokens: Tokens | null = null;
let ouvintes: Ouvintes | null = null;
let renovacaoEmCurso: Promise<Tokens> | null = null;

export function iniciarSessaoApi(atuais: Tokens, novosOuvintes: Ouvintes): void {
  tokens = atuais;
  ouvintes = novosOuvintes;
}

export function encerrarSessaoApi(): void {
  tokens = null;
  ouvintes = null;
  renovacaoEmCurso = null;
}

/**
 * Renova os tokens uma vez so, mesmo que varias chamadas recebam 401 ao
 * mesmo tempo: todas esperam a mesma promessa. Isso importa porque a API
 * troca o token de renovacao a cada uso, e dois pedidos de renovacao com o
 * mesmo token fariam o segundo falhar.
 */
function renovar(): Promise<Tokens> {
  if (!renovacaoEmCurso) {
    const atuais = tokens;
    if (!atuais) {
      return Promise.reject(new ErroApi('Faça login para continuar.', 401));
    }
    renovacaoEmCurso = renovarTokens(atuais.renovacao)
      .then((novos) => {
        if (tokens === atuais) {
          tokens = novos;
          ouvintes?.aoRenovar(novos);
        }
        return novos;
      })
      .finally(() => {
        renovacaoEmCurso = null;
      });
  }
  return renovacaoEmCurso;
}

export async function chamarApi<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const enviar = (acesso: string) =>
    requisitar<T>(`${URL_API_APP}${caminho}`, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${acesso}` },
    });

  const usado = tokens?.acesso;
  if (!usado) {
    throw new ErroApi('Faça login para continuar.', 401);
  }

  try {
    return await enviar(usado);
  } catch (erro) {
    if (!(erro instanceof ErroApi) || erro.status !== 401) {
      throw erro;
    }
  }

  // Outra chamada pode ja ter renovado enquanto esta esperava a resposta.
  if (tokens && tokens.acesso !== usado) {
    return enviar(tokens.acesso);
  }

  try {
    const novos = await renovar();
    return await enviar(novos.acesso);
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 401) {
      ouvintes?.aoExpirar();
    }
    throw erro;
  }
}
