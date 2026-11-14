import { useEffect, useState } from 'react';

/**
 * Devolve o valor recebido so depois que ele para de mudar por um tempo.
 *
 * Na busca, cada letra digitada muda o texto. Sem o atraso, digitar
 * "frieren" faria sete requisicoes; com ele, a consulta sai uma vez, quando o
 * usuario faz uma pausa. Isso poupa a rede e o limite de requisicoes da API.
 */
export function useDebounce<T>(valor: T, atrasoMs = 500): T {
  const [atrasado, setAtrasado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setAtrasado(valor), atrasoMs);
    // Cada nova letra cancela o temporizador da letra anterior.
    return () => clearTimeout(temporizador);
  }, [valor, atrasoMs]);

  return atrasado;
}
