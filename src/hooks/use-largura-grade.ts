import { useWindowDimensions } from 'react-native';

import { Espacamento } from '@/constants/tema';

/**
 * Largura de cada item para que uma grade preencha exatamente a linha.
 *
 * Fixar a largura do cartaz em um valor absoluto faz a grade se comportar de
 * formas diferentes conforme o aparelho: em telas estreitas os itens ficam
 * apertados e em telas largas sobra espaco nas bordas. Aqui a largura e
 * derivada da largura util da janela, descontados os recuos laterais e os
 * intervalos entre colunas.
 *
 * O valor vem de useWindowDimensions, e nao de Dimensions.get, para que a
 * grade acompanhe mudancas de tamanho da janela em vez de ficar presa a medida
 * lida na primeira renderizacao.
 */
export function useLarguraGrade(
  colunas: number,
  recuoLateral: number = Espacamento.lg,
  intervalo: number = Espacamento.md,
): number {
  const { width } = useWindowDimensions();
  const disponivel = width - recuoLateral * 2 - intervalo * (colunas - 1);
  return Math.floor(disponivel / colunas);
}
