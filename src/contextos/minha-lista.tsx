import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { animes, type Anime } from '@/dados/animes';

interface ValorContexto {
  /** Identificadores dos animes salvos, na ordem em que foram adicionados. */
  salvos: number[];
  /** Animes salvos ja resolvidos a partir do catalogo. */
  animesSalvos: Anime[];
  estaSalvo: (id: number) => boolean;
  alternar: (id: number) => void;
  remover: (id: number) => void;
}

const Contexto = createContext<ValorContexto | undefined>(undefined);

/** Titulos que ja aparecem salvos na primeira abertura do aplicativo. */
const INICIAIS = [1, 9, 11, 16];

/**
 * Guarda a lista de animes salvos pelo usuario.
 *
 * O botao de salvar fica na tela de detalhe e a exibicao na aba de lista. Como
 * sao telas irmas, o estado nao pode ser passado por propriedades e vive aqui,
 * acima de ambas na arvore de componentes.
 */
export function ProvedorMinhaLista({ children }: { children: ReactNode }) {
  const [salvos, setSalvos] = useState<number[]>(INICIAIS);

  const alternar = useCallback((id: number) => {
    setSalvos((atual) =>
      atual.includes(id) ? atual.filter((salvo) => salvo !== id) : [id, ...atual],
    );
  }, []);

  const remover = useCallback((id: number) => {
    setSalvos((atual) => atual.filter((salvo) => salvo !== id));
  }, []);

  const valor = useMemo<ValorContexto>(() => {
    const animesSalvos = salvos.flatMap((id) => {
      const anime = animes.find((item) => item.id === id);
      return anime ? [anime] : [];
    });

    return {
      salvos,
      animesSalvos,
      estaSalvo: (id: number) => salvos.includes(id),
      alternar,
      remover,
    };
  }, [salvos, alternar, remover]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/**
 * Acessa a lista salva. Lanca erro quando usado fora do provedor, de modo que
 * o problema apareca na montagem e nao como um valor indefinido silencioso.
 */
export function useMinhaLista(): ValorContexto {
  const valor = useContext(Contexto);
  if (!valor) {
    throw new Error('useMinhaLista precisa estar dentro de ProvedorMinhaLista.');
  }
  return valor;
}
