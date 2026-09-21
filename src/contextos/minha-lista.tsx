import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { animes, type Anime } from '@/dados/animes';

interface ValorContexto {
  /** Identificadores dos animes salvos, na ordem em que foram adicionados. */
  salvos: number[];
  /** Animes salvos ja resolvidos a partir do catalogo. */
  animesSalvos: Anime[];
  /** Falso enquanto a lista gravada ainda esta sendo lida do disco. */
  carregado: boolean;
  estaSalvo: (id: number) => boolean;
  alternar: (id: number) => void;
  remover: (id: number) => void;
}

const Contexto = createContext<ValorContexto | undefined>(undefined);

/** Chave usada no armazenamento local do aparelho. */
const CHAVE = '@crunchyroll:minha-lista';

/** Titulos que ja aparecem salvos na primeira abertura do aplicativo. */
const INICIAIS = [1, 9, 11, 16];

/**
 * Guarda a lista de animes salvos pelo usuario e a mantem entre aberturas.
 *
 * O botao de salvar fica na tela de detalhe e a exibicao na aba de lista. Como
 * sao telas irmas, o estado nao pode ser passado por propriedades e vive aqui,
 * acima de ambas na arvore de componentes.
 */
export function ProvedorMinhaLista({ children }: { children: ReactNode }) {
  const [salvos, setSalvos] = useState<number[]>(INICIAIS);
  const [carregado, setCarregado] = useState(false);

  /** Le a lista gravada uma unica vez, na montagem do provedor. */
  useEffect(() => {
    let ativo = true;

    AsyncStorage.getItem(CHAVE)
      .then((bruto) => {
        if (!ativo || bruto === null) {
          return;
        }
        const lido: unknown = JSON.parse(bruto);
        // O conteudo vem do disco e pode ter sido gravado por uma versao
        // anterior do aplicativo, entao o formato e verificado antes do uso.
        if (Array.isArray(lido) && lido.every((item) => typeof item === 'number')) {
          setSalvos(lido);
        }
      })
      .catch(() => {
        // Falha de leitura nao deve impedir o uso: a lista inicial permanece.
      })
      .finally(() => {
        if (ativo) {
          setCarregado(true);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  /**
   * Grava a lista a cada alteracao, mas apenas depois da leitura inicial, para
   * que o valor padrao nao sobrescreva o que ja estava no disco.
   */
  useEffect(() => {
    if (!carregado) {
      return;
    }
    AsyncStorage.setItem(CHAVE, JSON.stringify(salvos)).catch(() => {
      // Sem tratamento adicional: a lista continua valida em memoria.
    });
  }, [salvos, carregado]);

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
      carregado,
      estaSalvo: (id: number) => salvos.includes(id),
      alternar,
      remover,
    };
  }, [salvos, carregado, alternar, remover]);

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
