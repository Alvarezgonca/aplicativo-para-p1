import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { usePersistedState } from '@/hooks/use-persisted-state';
import type { AnimeResumo } from '@/services/tipos';

/** Em que lingua o nome dos animes aparece. */
export type IdiomaTitulo = 'ingles' | 'romaji' | 'nativo';

export interface Preferencias {
  idiomaTitulo: IdiomaTitulo;
  /** Ao terminar um episodio, o player abre o proximo sozinho. */
  reproducaoAutomatica: boolean;
  /** Imagens menores nas listas, para gastar menos dados moveis. */
  economiaDados: boolean;
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  idiomaTitulo: 'ingles',
  reproducaoAutomatica: true,
  economiaDados: false,
};

type Titulos = Pick<AnimeResumo, 'titulo' | 'tituloRomaji' | 'tituloNativo'>;

interface ValorContexto {
  preferencias: Preferencias;
  carregado: boolean;
  alterar: (mudanca: Partial<Preferencias>) => void;
  /** Nome do anime no idioma escolhido, caindo no ingles quando nao existe. */
  tituloDe: (anime: Titulos) => string;
}

const Contexto = createContext<ValorContexto | undefined>(undefined);

/**
 * Preferencias do aparelho, gravadas com o usePersistedState.
 *
 * O valor salvo e mesclado com o padrao: uma preferencia criada numa versao
 * nova do aplicativo ganha o valor padrao mesmo para quem ja tinha as outras
 * gravadas.
 */
export function ProvedorPreferencias({ children }: { children: ReactNode }) {
  const [salvas, setSalvas, carregado] = usePersistedState<Partial<Preferencias>>(
    'preferencias',
    PREFERENCIAS_PADRAO,
  );

  const preferencias = useMemo<Preferencias>(
    () => ({ ...PREFERENCIAS_PADRAO, ...salvas }),
    [salvas],
  );

  const alterar = useCallback(
    (mudanca: Partial<Preferencias>) => setSalvas((atuais) => ({ ...atuais, ...mudanca })),
    [setSalvas],
  );

  const tituloDe = useCallback(
    (anime: Titulos) => {
      if (preferencias.idiomaTitulo === 'romaji') {
        return anime.tituloRomaji || anime.titulo;
      }
      if (preferencias.idiomaTitulo === 'nativo') {
        return anime.tituloNativo || anime.titulo;
      }
      return anime.titulo;
    },
    [preferencias.idiomaTitulo],
  );

  const valor = useMemo<ValorContexto>(
    () => ({ preferencias, carregado, alterar, tituloDe }),
    [preferencias, carregado, alterar, tituloDe],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePreferencias(): ValorContexto {
  const valor = useContext(Contexto);
  if (!valor) {
    throw new Error('usePreferencias precisa estar dentro de ProvedorPreferencias.');
  }
  return valor;
}
