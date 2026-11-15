import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { encerrarSessaoApi, iniciarSessaoApi } from '@/services/api-app';
import {
  cadastrar as cadastrarNaApi,
  encerrarSessao,
  entrar as entrarNaApi,
  type Sessao,
  type Tokens,
  type Usuario,
} from '@/services/autenticacao';
import { limparCache } from '@/services/cache';
import { seguro } from '@/services/seguro';
import { storage } from '@/services/storage';

const CHAVE_SESSAO = 'sessao';
const CHAVE_BOAS_VINDAS = 'boas-vindas-vista';
const CHAVE_ULTIMO_EMAIL = 'ultimo-email';
const CHAVE_TOKEN_ACESSO = 'token-acesso';
const CHAVE_TOKEN_RENOVACAO = 'token-renovacao';

interface ValorSessao {
  /** Falso enquanto a sessao salva ainda esta sendo lida do aparelho. */
  pronto: boolean;
  usuario: Usuario | null;
  boasVindasVista: boolean;
  /** Ultimo e-mail que entrou, para ja vir preenchido no login. */
  ultimoEmail: string;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  concluirBoasVindas: () => Promise<void>;
}

const Contexto = createContext<ValorSessao | undefined>(undefined);

interface Estado {
  pronto: boolean;
  usuario: Usuario | null;
  boasVindasVista: boolean;
  ultimoEmail: string;
}

async function gravarTokens(tokens: Tokens): Promise<void> {
  await seguro.set(CHAVE_TOKEN_ACESSO, tokens.acesso);
  await seguro.set(CHAVE_TOKEN_RENOVACAO, tokens.renovacao);
}

/** Apaga do aparelho tudo o que identifica a sessao (o servidor e a parte). */
async function apagarSessaoLocal(): Promise<void> {
  encerrarSessaoApi();
  await seguro.remove(CHAVE_TOKEN_ACESSO);
  await seguro.remove(CHAVE_TOKEN_RENOVACAO);
  await storage.remove(CHAVE_SESSAO);
  await limparCache();
}

/**
 * Sessao do usuario (contexto de autenticacao).
 *
 * Ao abrir o aplicativo, le em paralelo o usuario salvo (AsyncStorage), os
 * dois tokens (SecureStore) e a marca de boas-vindas. Enquanto isso, pronto
 * fica falso e o layout raiz segura a tela de abertura, para o usuario nao
 * ver o login piscar antes de o aplicativo descobrir que ele ja estava
 * logado.
 *
 * Os tokens sao entregues ao cliente da API (api-app.ts), que os usa em
 * cada chamada e os renova quando vencem. Se a renovacao for recusada, a
 * sessao local e apagada e o layout protegido manda para o login.
 */
export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({
    pronto: false,
    usuario: null,
    boasVindasVista: false,
    ultimoEmail: '',
  });

  /** A sessao acabou no servidor (token recusado): volta ao login. */
  const expirar = useCallback(() => {
    apagarSessaoLocal().finally(() => {
      setEstado((atual) => ({ ...atual, usuario: null }));
    });
  }, []);

  const ativar = useCallback(
    (tokens: Tokens) => {
      iniciarSessaoApi(tokens, { aoRenovar: gravarTokens, aoExpirar: expirar });
    },
    [expirar],
  );

  useEffect(() => {
    Promise.all([
      storage.get<Usuario | null>(CHAVE_SESSAO, null),
      seguro.get(CHAVE_TOKEN_ACESSO),
      seguro.get(CHAVE_TOKEN_RENOVACAO),
      storage.get(CHAVE_BOAS_VINDAS, false),
      storage.get(CHAVE_ULTIMO_EMAIL, ''),
    ]).then(([usuario, acesso, renovacao, boasVindasVista, ultimoEmail]) => {
      // Usuario sem os dois tokens (ou o contrario) nao vale como sessao.
      const valida = usuario !== null && typeof usuario.id === 'string' && !!acesso && !!renovacao;
      if (valida) {
        ativar({ acesso, renovacao });
      }
      setEstado({
        pronto: true,
        usuario: valida ? usuario : null,
        boasVindasVista,
        ultimoEmail,
      });
    });
  }, [ativar]);

  /** Guarda a sessao recem-aberta (login ou cadastro) e entra no aplicativo. */
  const abrir = useCallback(
    async (sessao: Sessao) => {
      await gravarTokens(sessao.tokens);
      await storage.set(CHAVE_SESSAO, sessao.usuario);
      await storage.set(CHAVE_ULTIMO_EMAIL, sessao.usuario.email);
      // Quem ja entrou uma vez nao precisa ver a apresentacao de novo.
      await storage.set(CHAVE_BOAS_VINDAS, true);
      ativar(sessao.tokens);
      setEstado((atual) => ({
        ...atual,
        usuario: sessao.usuario,
        ultimoEmail: sessao.usuario.email,
        boasVindasVista: true,
      }));
    },
    [ativar],
  );

  const entrar = useCallback(
    async (email: string, senha: string) => abrir(await entrarNaApi(email, senha)),
    [abrir],
  );

  const cadastrar = useCallback(
    async (nome: string, email: string, senha: string) =>
      abrir(await cadastrarNaApi(nome, email, senha)),
    [abrir],
  );

  /**
   * Encerra a sessao: avisa o servidor (o token de renovacao deixa de valer)
   * e apaga os tokens, o usuario salvo e o cache. Sem internet, a sessao
   * local e apagada do mesmo jeito. A marca de boas-vindas e o ultimo e-mail
   * continuam, para o proximo acesso ir direto ao login ja preenchido.
   */
  const sair = useCallback(async () => {
    const renovacao = await seguro.get(CHAVE_TOKEN_RENOVACAO);
    if (renovacao) {
      await encerrarSessao(renovacao).catch(() => undefined);
    }
    await apagarSessaoLocal();
    setEstado((atual) => ({ ...atual, usuario: null }));
  }, []);

  const concluirBoasVindas = useCallback(async () => {
    await storage.set(CHAVE_BOAS_VINDAS, true);
    setEstado((atual) => ({ ...atual, boasVindasVista: true }));
  }, []);

  const valor = useMemo<ValorSessao>(
    () => ({ ...estado, entrar, cadastrar, sair, concluirBoasVindas }),
    [estado, entrar, cadastrar, sair, concluirBoasVindas],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ValorSessao {
  const valor = useContext(Contexto);
  if (!valor) {
    throw new Error('useSessao precisa estar dentro de ProvedorSessao.');
  }
  return valor;
}
