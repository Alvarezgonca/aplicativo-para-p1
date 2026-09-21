import { StyleSheet, View } from 'react-native';

import { Cores, Raio } from '@/constants/tema';

interface Props {
  /** Fracao preenchida, de 0 a 1. Valores fora da faixa sao limitados. */
  progresso: number;
  altura?: number;
}

/** Barra fina que indica quanto de um episodio ja foi assistido. */
export function BarraProgresso({ progresso, altura = 3 }: Props) {
  const preenchimento = Math.min(Math.max(progresso, 0), 1);

  return (
    <View style={[styles.trilho, { height: altura }]}>
      <View
        style={[styles.preenchido, { width: `${preenchimento * 100}%`, height: altura }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  trilho: {
    width: '100%',
    backgroundColor: Cores.superficieAlta,
    borderRadius: Raio.pilula,
    overflow: 'hidden',
  },
  preenchido: { backgroundColor: Cores.marca },
});
