import { useCallback, useEffect, useState } from 'react';

import { storage } from '@/services/storage';

/**
 * Igual ao useState, mas o valor sobrevive ao fechamento do aplicativo.
 *
 * Na montagem le o valor gravado no AsyncStorage (enquanto isso devolve o
 * valor inicial e carregado = false). Cada alteracao atualiza a memoria na
 * hora e grava no disco em seguida. Aceita valor direto ou funcao, como o
 * setter do useState.
 *
 * Uso: const [tema, setTema, carregado] = usePersistedState('tema', 'escuro');
 */
export function usePersistedState<T>(
  chave: string,
  inicial: T,
): [T, (proximo: T | ((atual: T) => T)) => void, boolean] {
  // O valor inicial so vale para a primeira leitura. Guardado no useState,
  // ele fica estavel: um objeto novo a cada renderizacao (como { a: 1 })
  // nao dispara uma nova leitura do disco.
  const [padrao] = useState(inicial);
  const [estado, setEstado] = useState<{ valor: T; carregado: boolean }>({
    valor: padrao,
    carregado: false,
  });

  useEffect(() => {
    let ativo = true;
    storage.get<T>(chave, padrao).then((lido) => {
      if (ativo) {
        setEstado({ valor: lido, carregado: true });
      }
    });
    return () => {
      ativo = false;
    };
  }, [chave, padrao]);

  const alterar = useCallback(
    (proximo: T | ((atual: T) => T)) => {
      setEstado((atual) => {
        const valor =
          typeof proximo === 'function' ? (proximo as (atual: T) => T)(atual.valor) : proximo;
        storage.set(chave, valor);
        return { valor, carregado: true };
      });
    },
    [chave],
  );

  return [estado.valor, alterar, estado.carregado];
}
