import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BarraSuperior } from '@/componentes/barra-superior';
import { Carrossel } from '@/componentes/carrossel';
import { CartaoContinuar } from '@/componentes/cartao-continuar';
import { Destaque } from '@/componentes/destaque';
import { AlturaBarraAbas, Cores, Espacamento, Fonte } from '@/constants/tema';
import { animes } from '@/dados/animes';
import { colecoes } from '@/dados/colecoes';
import { proximoEpisodio } from '@/dados/episodios';

/**
 * Itens da fileira de continuidade: para cada anime em andamento, o primeiro
 * episodio ainda nao concluido. O calculo e feito uma unica vez, fora do
 * componente, por depender apenas de dados estaticos.
 */
const emAndamento = animes.filter((anime) => anime.destaque).flatMap((anime) => {
  const episodio = proximoEpisodio(anime);
  return episodio ? [{ anime, episodio }] : [];
});

export default function TelaInicio() {
  return (
    <View style={styles.container}>
      <BarraSuperior sobreposta />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conteudo}>
        <Destaque />

        <View style={styles.secaoContinuar}>
          <Text style={styles.tituloSecao}>Continuar assistindo</Text>
          <FlatList
            data={emAndamento}
            keyExtractor={(item) => item.episodio.id}
            renderItem={({ item }) => (
              <CartaoContinuar anime={item.anime} episodio={item.episodio} />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fileira}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
          />
        </View>

        {colecoes.map((colecao) => (
          <Carrossel key={colecao.id} titulo={colecao.titulo} animes={colecao.animes} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { paddingBottom: AlturaBarraAbas + Espacamento.xl },
  secaoContinuar: { marginTop: Espacamento.lg },
  tituloSecao: {
    color: Cores.texto,
    fontSize: Fonte.titulo,
    fontWeight: '700',
    paddingHorizontal: Espacamento.lg,
    marginBottom: Espacamento.md,
  },
  fileira: { paddingHorizontal: Espacamento.lg },
  separador: { width: Espacamento.md },
});
