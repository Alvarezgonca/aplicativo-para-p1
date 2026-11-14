import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { entrar as entrarNaApi, type Usuario } from '@/services/autenticacao';
import { limparCache } from '@/services/cache';
import { seguro } from '@/services/seguro';
import { storage } from '@/services/storage';

const CHAVE_SESSAO = 'sessao';
const CHAVE_BOAS_VINDAS = 'boas-vindas-vista';
const CHAVE_ULTIMO_USUARIO = 'ultimo-usuario';
const CHAVE_TOKEN = 'token';

interface ValorSessao {
  /** Falso enquanto a sessao salva ainda esta sendo lida do aparelho. */
  pronto: boolean;
  usuario: Usuario | null;
  token: string | null;
  boasVindasVista: boolean;
  /** Ultimo nome de usuario que entrou, para ja vir preenchido no login. */
  ultimoUsuario: string;
  entrar: (usuario: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  concluirBoasVindas: () => Promise<void>;
}

const Contexto = createContext<ValorSessao | undefined>(undefined);

interface Estado {
  pronto: boolean;
  usuario: Usuario | null;
  token: string | null;
  boasVindasVista: boolean;
  ultimoUsuario: string;
}

/**
 * Sessao do usuario (contexto de autenticacao).
 *
 * Ao abrir o aplicativo, le em paralelo o perfil salvo (AsyncStorage), o
 * token (SecureStore) e a marca de boas-vindas. Enquanto isso, pronto fica
 * falso e o layout raiz segura a tela de abertura, para o usuario nao ver o
 * login piscar antes de o aplicativo descobrir que ele ja estava logado.
 */
export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({
    pronto: false,
    usuario: null,
    token: null,
    boasVindasVista: false,
    ultimoUsuario: '',
  });

  useEffect(() => {
    Promise.all([
      storage.get<Usuario | null>(CHAVE_SESSAO, null),
      seguro.get(CHAVE_TOKEN),
      storage.get(CHAVE_BOAS_VINDAS, false),
      storage.get(CHAVE_ULTIMO_USUARIO, ''),
    ]).then(([usuario, token, boasVindasVista, ultimoUsuario]) => {
      // Perfil sem token (ou o contrario) nao vale como sessao.
      const valida = usuario !== null && token !== null;
      setEstado({
        pronto: true,
        usuario: valida ? usuario : null,
        token: valida ? token : null,
        boasVindasVista,
        ultimoUsuario,
      });
    });
  }, []);

  const entrar = useCallback(async (usuario: string, senha: string) => {
    const resultado = await entrarNaApi(usuario, senha);
    await seguro.set(CHAVE_TOKEN, resultado.token);
    await storage.set(CHAVE_SESSAO, resultado.usuario);
    await storage.set(CHAVE_ULTIMO_USUARIO, resultado.usuario.usuario);
    // Quem ja entrou uma vez nao precisa ver a apresentacao de novo.
    await storage.set(CHAVE_BOAS_VINDAS, true);
    setEstado((atual) => ({
      ...atual,
      usuario: resultado.usuario,
      token: resultado.token,
      ultimoUsuario: resultado.usuario.usuario,
      boasVindasVista: true,
    }));
  }, []);

  /**
   * Encerra a sessao: apaga o token do cofre, o perfil salvo e o cache das
   * consultas. A marca de boas-vindas e o ultimo usuario continuam, para o
   * proximo acesso ir direto ao login ja preenchido.
   */
  const sair = useCallback(async () => {
    await seguro.remove(CHAVE_TOKEN);
    await storage.remove(CHAVE_SESSAO);
    await limparCache();
    setEstado((atual) => ({ ...atual, usuario: null, token: null }));
  }, []);

  const concluirBoasVindas = useCallback(async () => {
    await storage.set(CHAVE_BOAS_VINDAS, true);
    setEstado((atual) => ({ ...atual, boasVindasVista: true }));
  }, []);

  const valor = useMemo<ValorSessao>(
    () => ({ ...estado, entrar, sair, concluirBoasVindas }),
    [estado, entrar, sair, concluirBoasVindas],
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
