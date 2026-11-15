/**
 * Camada de comunicacao HTTP do aplicativo.
 *
 * Toda requisicao passa pela funcao requisitar. Concentrar o fetch em um unico
 * ponto garante que todas as telas recebam o mesmo tempo limite, a mesma
 * politica de nova tentativa e as mesmas mensagens de erro, e deixa as telas
 * livres de detalhes de rede.
 */

/** Tempo maximo de espera por uma resposta antes de desistir. */
const TEMPO_LIMITE_MS = 12_000;

/** Quantas vezes uma falha temporaria e repetida antes de chegar a tela. */
const TENTATIVAS_EXTRAS = 1;

/**
 * Erro padronizado da camada de rede.
 *
 * O status guarda o codigo HTTP da resposta. Quando nao houve resposta (sem
 * internet ou tempo limite esgotado), o status e 0.
 */
export class ErroApi extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
  }
}

/** Traduz o codigo HTTP em uma mensagem que o usuario consegue entender. */
function mensagemPorStatus(status: number): string {
  if (status === 400) return 'Requisição inválida.';
  if (status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (status === 403) return 'Acesso negado.';
  if (status === 404) return 'Conteúdo não encontrado.';
  if (status === 429)
    return 'Muitas requisições seguidas. Aguarde alguns segundos e tente de novo.';
  if (status >= 500) return 'O servidor está instável no momento. Tente de novo em instantes.';
  return `Erro ${status} na comunicação com o servidor.`;
}

/**
 * Mensagem de uma resposta de erro.
 *
 * A API do aplicativo responde os erros como { erro: "texto" }, ja escrito
 * para o usuario ("Já existe uma conta com este e-mail."). Quando o corpo
 * traz esse texto e o erro e do pedido (4xx), ele e usado; nos outros casos,
 * a mensagem sai do codigo HTTP.
 */
async function mensagemDaResposta(resposta: Response): Promise<string> {
  if (resposta.status < 500) {
    try {
      const corpo = (await resposta.json()) as { erro?: unknown };
      if (typeof corpo.erro === 'string' && corpo.erro) {
        return corpo.erro;
      }
    } catch {
      // Corpo vazio ou que nao e JSON: fica a mensagem pelo status.
    }
  }
  return mensagemPorStatus(resposta.status);
}

/**
 * Falhas que costumam se resolver sozinhas: queda momentanea de rede e erro
 * interno do servidor. Erros 4xx dependem do pedido e nao mudam ao repetir.
 */
function falhaTemporaria(status: number): boolean {
  return status === 0 || status >= 500;
}

export interface OpcoesRequisicao {
  /**
   * Se o pedido pode ser repetido sem efeito colateral. Por padrao vale para
   * GET, PUT e DELETE, que deixam o servidor igual se chegarem duas vezes; um
   * POST repetido poderia, por exemplo, tentar criar a mesma conta duas
   * vezes. Uma consulta GraphQL e POST mas so le dados, entao informa true.
   */
  idempotente?: boolean;
}

function podeRepetir(init: RequestInit, opcoes: OpcoesRequisicao): boolean {
  if (opcoes.idempotente !== undefined) {
    return opcoes.idempotente;
  }
  const metodo = (init.method ?? 'GET').toUpperCase();
  return metodo === 'GET' || metodo === 'PUT' || metodo === 'DELETE';
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/**
 * Executa o fetch com tempo limite.
 *
 * O fetch nao tem tempo limite proprio: sem o AbortController, uma conexao
 * ruim deixaria o indicador de carregamento girando para sempre.
 */
async function executar(url: string, init: RequestInit): Promise<Response> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);

  try {
    return await fetch(url, { ...init, signal: controlador.signal });
  } catch {
    // O fetch so rejeita quando nao ha resposta nenhuma do servidor.
    if (controlador.signal.aborted) {
      throw new ErroApi('O servidor demorou demais para responder.', 0);
    }
    throw new ErroApi('Sem conexão com a internet.', 0);
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Faz uma requisicao e devolve o corpo da resposta ja convertido de JSON.
 *
 * Respostas 4xx e 5xx nao fazem o fetch falhar sozinho, por isso o campo ok
 * e verificado antes de ler o corpo. Falhas temporarias de pedidos
 * idempotentes sao repetidas uma vez, com uma pequena espera, antes de o erro
 * ser repassado para a tela.
 */
export async function requisitar<T>(
  url: string,
  init: RequestInit = {},
  opcoes: OpcoesRequisicao = {},
): Promise<T> {
  const cabecalhos: Record<string, string> = {
    Accept: 'application/json',
    // O tipo do corpo so e declarado quando ha corpo (POST, PUT, PATCH).
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  for (let tentativa = 0; ; tentativa += 1) {
    try {
      const resposta = await executar(url, { ...init, headers: cabecalhos });

      if (!resposta.ok) {
        throw new ErroApi(await mensagemDaResposta(resposta), resposta.status);
      }

      // 204 No Content: deu certo e nao ha corpo (remover, sair, limpar).
      if (resposta.status === 204) {
        return undefined as T;
      }

      return (await resposta.json()) as T;
    } catch (erro) {
      const status = erro instanceof ErroApi ? erro.status : 0;

      if (tentativa < TENTATIVAS_EXTRAS && falhaTemporaria(status) && podeRepetir(init, opcoes)) {
        await esperar(800 * (tentativa + 1));
        continue;
      }

      if (erro instanceof ErroApi) {
        throw erro;
      }
      // Corpo que nao e JSON valido.
      throw new ErroApi('O servidor enviou uma resposta inválida.', 0);
    }
  }
}

/** Extrai a mensagem de qualquer erro capturado em um bloco catch. */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error) {
    return erro.message;
  }
  return 'Erro inesperado.';
}
