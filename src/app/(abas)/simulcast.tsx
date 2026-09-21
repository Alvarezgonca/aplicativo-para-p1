import { StyleSheet, Text, View } from 'react-native';

import { Cores, Fonte } from '@/constants/tema';

export default function TelaSimulcast() {
  return (
    <View style={styles.container}>
      <Text style={styles.texto}>Simulcast</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Cores.fundo,
  },
  texto: {
    color: Cores.textoSecundario,
    fontSize: Fonte.titulo,
  },
});
