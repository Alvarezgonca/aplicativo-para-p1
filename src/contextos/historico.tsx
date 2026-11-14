import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

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
 */
export function ProvedorHistorico({ children }: { children: ReactNode }) {
  const [registros, setRegistros] = useState<RegistroHistorico[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    storage.get<RegistroHistorico[]>(CHAVE, []).then((lidos) => {
      setRegistros(Array.isArray(lidos) ? lidos : []);
      setCarregado(true);
    });
  }, []);

  /**
   * Coloca o registro no topo, substituindo o anterior do mesmo episodio.
   * A gravacao no disco acontece aqui, mas o player so chama esta funcao de
   * tempos em tempos (e ao sair), e nao a cada avancar da barra: gravar no
   * armazenamento a todo instante deixaria o aplicativo lento.
   */
  const registrar = useCallback((novo: Omit<RegistroHistorico, 'assistidoEm'>) => {
    setRegistros((atuais) => {
      const outros = atuais.filter(
        (item) => !(item.animeId === novo.animeId && item.episodio === novo.episodio),
      );
      const atualizados = [{ ...novo, assistidoEm: Date.now() }, ...outros].slice(0, LIMITE);
      storage.set(CHAVE, atualizados);
      return atualizados;
    });
  }, []);

  const limpar = useCallback(() => {
    setRegistros([]);
    storage.remove(CHAVE);
  }, []);

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
