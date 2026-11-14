import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useSessao } from '@/contextos/sessao';
import { storage } from '@/services/storage';

/** Um episodio assistido (inteiro ou em parte). */
export interface RegistroHistorico {
  animeId: number;
  titulo: string;
  capa: string;
  banner: string | null;
  episodio: number;
  tituloEpisodio: string;
  miniatura: string | null;
  /** Duracao do episodio em minutos. */
  duracao: number;
  /** Fracao assistida, de 0 a 1. */
  progresso: number;
  /** Ultima vez que o episodio foi reproduzido, em milissegundos. */
  assistidoEm: number;
}

/** A partir desta fracao o episodio conta como assistido. */
export const FRACAO_CONCLUIDO = 0.95;

/** Limite de registros guardados, para o historico nao crescer sem fim. */
const LIMITE = 200;

const CHAVE = 'historico';

interface ValorContexto {
  /** Registros do mais recente para o mais antigo. */
  registros: RegistroHistorico[];
  carregado: boolean;
  /** Fracao ja assistida de um episodio (0 quando nunca foi aberto). */
  progressoDe: (animeId: number, episodio: number) => number;
  registrar: (registro: Omit<RegistroHistorico, 'assistidoEm'>) => void;
  limpar: () => void;
}

const Contexto = createContext<ValorContexto | undefined>(undefined);

/**
 * Historico de reproducao, guardado no aparelho.
 *
 * O player chama registrar enquanto o episodio toca; a tela inicial usa os
 * registros para a fileira "Continuar assistindo", o detalhe para as barras de
 * progresso dos episodios e o perfil para as estatisticas.
 *
 * Como a lista, o historico e de cada usuario: a chave leva o id da conta.
 */
export function ProvedorHistorico({ children }: { children: ReactNode }) {
  const { usuario } = useSessao();
  const chave = usuario ? `${CHAVE}:${usuario.id}` : null;
  const [estado, setEstado] = useState<{
    chave: string | null;
    registros: RegistroHistorico[];
  }>({ chave: null, registros: [] });

  useEffect(() => {
    if (!chave) {
      return;
    }
    let ativo = true;
    storage.get<RegistroHistorico[]>(chave, []).then((lidos) => {
      if (ativo) {
        setEstado({ chave, registros: Array.isArray(lidos) ? lidos : [] });
      }
    });
    return () => {
      ativo = false;
    };
  }, [chave]);

  const carregado = chave === null || estado.chave === chave;
  const registros = useMemo(
    () => (chave !== null && estado.chave === chave ? estado.registros : []),
    [chave, estado],
  );

  /**
   * Coloca o registro no topo, substituindo o anterior do mesmo episodio.
   * A gravacao no disco acontece aqui, mas o player so chama esta funcao de
   * tempos em tempos (e ao sair), e nao a cada avancar da barra: gravar no
   * armazenamento a todo instante deixaria o aplicativo lento.
   */
  const registrar = useCallback(
    (novo: Omit<RegistroHistorico, 'assistidoEm'>) => {
      if (!chave) {
        return;
      }
      setEstado((atual) => {
        // Gravacao que chega depois de trocar de conta nao entra no historico novo.
        if (atual.chave !== chave) {
          return atual;
        }
        const outros = atual.registros.filter(
          (item) => !(item.animeId === novo.animeId && item.episodio === novo.episodio),
        );
        const atualizados = [{ ...novo, assistidoEm: Date.now() }, ...outros].slice(0, LIMITE);
        storage.set(chave, atualizados);
        return { chave, registros: atualizados };
      });
    },
    [chave],
  );

  const limpar = useCallback(() => {
    if (!chave) {
      return;
    }
    setEstado({ chave, registros: [] });
    storage.remove(chave);
  }, [chave]);

  const valor = useMemo<ValorContexto>(
    () => ({
      registros,
      carregado,
      progressoDe: (animeId: number, episodio: number) =>
        registros.find((item) => item.animeId === animeId && item.episodio === episodio)
          ?.progresso ?? 0,
      registrar,
      limpar,
    }),
    [registros, carregado, registrar, limpar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useHistorico(): ValorContexto {
  const valor = useContext(Contexto);
  if (!valor) {
    throw new Error('useHistorico precisa estar dentro de ProvedorHistorico.');
  }
  return valor;
}
