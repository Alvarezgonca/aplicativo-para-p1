import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';

type Variante = 'marca' | 'neutro' | 'contorno';

interface Props {
  texto: string;
  variante?: Variante;
  style?: ViewStyle;
}

/**
 * Etiqueta curta usada para sinalizar dublagem, genero ou estado de um item.
 */
export function Selo({ texto, variante = 'neutro', style }: Props) {
  return (
    <View style={[styles.base, styles[variante], style]}>
      <Text style={[styles.texto, variante === 'marca' && styles.textoMarca]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Espacamento.sm,
    paddingVertical: 3,
    borderRadius: Raio.sm,
    alignSelf: 'flex-start',
  },
  marca: { backgroundColor: Cores.marca },
  neutro: { backgroundColor: Cores.superficieAlta },
  contorno: {
    backgroundColor: Cores.transparente,
    borderWidth: 1,
    borderColor: Cores.divisoria,
  },
  texto: {
    color: Cores.textoSecundario,
    fontSize: Fonte.minuscula,
    fontWeight: '700',
  },
  textoMarca: { color: Cores.texto },
});
