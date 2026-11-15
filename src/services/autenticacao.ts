import { requisitar } from '@/services/api';

/**
 * Autenticacao pela API do aplicativo (pasta api/ deste repositorio).
 *
 * Cada recurso tem a sua rota e o verbo HTTP diz a acao: POST /auth/entrar
 * abre uma sessao e devolve dois tokens, POST /auth/renovar troca o token
 * de renovacao por um par novo e POST /auth/sair encerra a sessao no
 * servidor. A senha so existe durante a chamada de entrar ou cadastrar:
 * nao e guardada no aparelho.
 *
 * Por padrao o aplicativo usa a API publicada. Para usar uma API rodando
 * na sua maquina, defina EXPO_PUBLIC_API_URL no arquivo .env da raiz, por
 * exemplo http://192.168.0.10:3000/v1 (o IP do computador na rede local).
 */
export const URL_API_APP = process.env.EXPO_PUBLIC_API_URL ?? 'https://animes-api.kogaip.com/v1';

/** Conta criada pela propria API para quem quiser testar sem cadastro. */
export const CONTA_DEMONSTRACAO = { email: 'demo@exemplo.com', senha: 'demo1234' };

/** Usuario da sessao, guardado no aparelho (sem senha e sem token). */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  /** Data de criacao da conta, em ISO 8601. */
  criadoEm: string;
}

export interface Tokens {
  /** JWT de curta duracao, enviado no cabecalho Authorization. */
  acesso: string;
  /** Token de longa duracao, usado so para pedir um novo token de acesso. */
  renovacao: string;
}

export interface Sessao {
  usuario: Usuario;
  tokens: Tokens;
}

interface RespostaSessao {
  usuario: Usuario;
  tokenAcesso: string;
  tokenRenovacao: string;
}

interface RespostaTokens {
  tokenAcesso: string;
  tokenRenovacao: string;
}

function paraSessao(resposta: RespostaSessao): Sessao {
  return {
    usuario: resposta.usuario,
    tokens: { acesso: resposta.tokenAcesso, renovacao: resposta.tokenRenovacao },
  };
}

function enviarJson<T>(caminho: string, corpo: unknown): Promise<T> {
  return requisitar<T>(`${URL_API_APP}${caminho}`, {
    method: 'POST',
    body: JSON.stringify(corpo),
  });
}

export async function entrar(email: string, senha: string): Promise<Sessao> {
  return paraSessao(
    await enviarJson<RespostaSessao>('/auth/entrar', { email: email.trim(), senha }),
  );
}

export async function cadastrar(nome: string, email: string, senha: string): Promise<Sessao> {
  return paraSessao(
    await enviarJson<RespostaSessao>('/auth/cadastro', {
      nome: nome.trim(),
      email: email.trim(),
      senha,
    }),
  );
}

export async function renovarTokens(renovacao: string): Promise<Tokens> {
  const resposta = await enviarJson<RespostaTokens>('/auth/renovar', { tokenRenovacao: renovacao });
  return { acesso: resposta.tokenAcesso, renovacao: resposta.tokenRenovacao };
}

/** Encerra a sessao no servidor. O token de renovacao deixa de valer na hora. */
export async function encerrarSessao(renovacao: string): Promise<void> {
  await enviarJson<void>('/auth/sair', { tokenRenovacao: renovacao });
}
