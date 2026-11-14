import { ErroApi, requisitar } from '@/services/api';

/**
 * Autenticacao pela API REST do DummyJSON.
 *
 * Diferente do catalogo (GraphQL, uma unica URL), aqui cada recurso tem a sua
 * rota e o verbo HTTP diz a acao: POST /auth/login cria a sessao e devolve um
 * token JWT; GET /auth/me devolve o usuario dono do token, enviado no
 * cabecalho Authorization. A conta de demonstracao e a emilys / emilyspass.
 */
const URL_AUTH = process.env.EXPO_PUBLIC_AUTH_URL ?? 'https://dummyjson.com/auth';

/** Validade pedida para o token: 30 dias, em minutos. */
const VALIDADE_TOKEN_MIN = 30 * 24 * 60;

export const CONTA_DEMONSTRACAO = { usuario: 'emilys', senha: 'emilyspass' };

/** Usuario da sessao, guardado no aparelho (sem senha e sem token). */
export interface Usuario {
  id: number;
  usuario: string;
  nome: string;
  sobrenome: string;
  email: string;
  foto: string;
}

/** Dados completos do perfil, buscados com o token. */
export interface Perfil extends Usuario {
  idade: number | null;
  nascimento: string | null;
  telefone: string | null;
  cidade: string | null;
  pais: string | null;
}

interface RespostaLogin {
  accessToken: string;
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
}

interface RespostaPerfil extends Omit<RespostaLogin, 'accessToken'> {
  age?: number;
  birthDate?: string;
  phone?: string;
  address?: { city?: string; country?: string };
}

function paraUsuario(dados: Omit<RespostaLogin, 'accessToken'>): Usuario {
  return {
    id: dados.id,
    usuario: dados.username,
    nome: dados.firstName,
    sobrenome: dados.lastName,
    email: dados.email,
    foto: dados.image,
  };
}

/**
 * Envia usuario e senha e devolve o usuario e o token.
 *
 * A senha so existe durante esta chamada: nao e guardada em lugar nenhum.
 */
export async function entrar(
  usuario: string,
  senha: string,
): Promise<{ usuario: Usuario; token: string }> {
  try {
    const dados = await requisitar<RespostaLogin>(`${URL_AUTH}/login`, {
      method: 'POST',
      body: JSON.stringify({
        username: usuario.trim(),
        password: senha,
        expiresInMins: VALIDADE_TOKEN_MIN,
      }),
    });
    return { usuario: paraUsuario(dados), token: dados.accessToken };
  } catch (erro) {
    // Nesta rota o 400 significa credencial errada, e nao pedido mal formado.
    if (erro instanceof ErroApi && erro.status === 400) {
      throw new ErroApi('Usuário ou senha incorretos.', 400);
    }
    throw erro;
  }
}

/** Busca o perfil do dono do token. Token vencido ou invalido gera erro 401. */
export async function buscarPerfil(token: string): Promise<Perfil> {
  const dados = await requisitar<RespostaPerfil>(`${URL_AUTH}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    ...paraUsuario(dados),
    idade: dados.age ?? null,
    nascimento: dados.birthDate ?? null,
    telefone: dados.phone ?? null,
    cidade: dados.address?.city ?? null,
    pais: dados.address?.country ?? null,
  };
}
