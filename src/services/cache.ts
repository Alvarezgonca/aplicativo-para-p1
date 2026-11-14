import { storage } from '@/services/storage';

/**
 * Cache de respostas da API no armazenamento local.
 *
 * Cada resposta e gravada junto com o horario em que foi salva. A pergunta que
 * define o tempo de validade e: por quanto tempo esse dado pode estar
 * desatualizado sem prejudicar o usuario? A grade de lancamentos muda ao
 * longo do dia; a lista de generos quase nunca muda.
 */

export const MINUTO = 60_000;
export const HORA = 60 * MINUTO;

/** Inicio das chaves de cache, usado para limpar todas de uma vez. */
export const PREFIXO_CACHE = 'cache:';

interface Entrada<T> {
  dados: T;
  salvoEm: number;
}

/**
 * Busca um dado passando pelo cache.
 *
 * 1. Se existe copia salva dentro da validade, ela e devolvida na hora, sem
 *    usar a rede. Isso deixa a tela instantanea e poupa o limite de
 *    requisicoes da API.
 * 2. Se a copia venceu (ou nao existe), a API e consultada e a resposta nova
 *    substitui a antiga.
 * 3. Se a API falhar e houver copia vencida, ela e usada mesmo assim: um dado
 *    antigo e melhor do que uma tela de erro quando o aparelho esta offline.
 *
 * O parametro forcar ignora a validade; e o que o gesto de puxar para
 * atualizar usa.
 */
export async function comCache<T>(
  chave: string,
  buscar: () => Promise<T>,
  validadeMs = 5 * MINUTO,
  forcar = false,
): Promise<T> {
  const chaveCompleta = PREFIXO_CACHE + chave;
  const guardado = await storage.get<Entrada<T> | null>(chaveCompleta, null);
  const fresco = guardado !== null && Date.now() - guardado.salvoEm < validadeMs;

  if (fresco && !forcar) {
    return guardado.dados;
  }

  try {
    const dados = await buscar();
    await storage.set<Entrada<T>>(chaveCompleta, { dados, salvoEm: Date.now() });
    return dados;
  } catch (erro) {
    if (guardado) {
      return guardado.dados;
    }
    throw erro;
  }
}

/** Apaga todas as respostas guardadas. Devolve quantas foram removidas. */
export function limparCache(): Promise<number> {
  return storage.removerPorPrefixo(PREFIXO_CACHE);
}
