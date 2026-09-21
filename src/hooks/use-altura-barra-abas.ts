import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlturaBarraAbas } from '@/constants/tema';

/**
 * Altura total ocupada pela barra de abas, ja somada a area que o sistema
 * reserva na base da tela.
 *
 * O Expo desenha o aplicativo por baixo das barras do sistema, entao a barra de
 * navegacao do aparelho fica sobre o conteudo. O recuo inferior varia conforme o
 * aparelho e o modo de navegacao escolhido pelo usuario, motivo pelo qual e
 * consultado em tempo de execucao em vez de fixado em uma constante.
 */
export function useAlturaBarraAbas(): number {
  const recuo = useSafeAreaInsets();
  return AlturaBarraAbas + recuo.bottom;
}
