import { ScrollView, StyleSheet, View } from 'react-native';

import { BarraSuperior } from '@/componentes/barra-superior';
import { Destaque } from '@/componentes/destaque';
import { AlturaBarraAbas, Cores } from '@/constants/tema';

/**
 * Tela inicial.
 *
 * A barra superior fica sobreposta ao banner, que ocupa a area visivel ao
 * abrir o aplicativo. O restante do conteudo e adicionado abaixo do destaque.
 */
export default function TelaInicio() {
  return (
    <View style={styles.container}>
      <BarraSuperior sobreposta />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.conteudo}>
        <Destaque />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { paddingBottom: AlturaBarraAbas },
});
