import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Cartaz, LarguraCartaz } from '@/componentes/cartaz';
import { Cores, Espacamento, Fonte } from '@/constants/tema';
import type { Anime } from '@/dados/animes';

interface Props {
  titulo: string;
  animes: Anime[];
}

/**
 * Secao horizontal com um titulo e uma fileira rolavel de cartazes.
 *
 * A fileira usa FlatList em vez de ScrollView porque a FlatList monta apenas
 * os itens visiveis, mantendo o custo constante independentemente do tamanho
 * da colecao.
 */
export function Carrossel({ titulo, animes }: Props) {
  if (animes.length === 0) {
    return null;
  }

  return (
    <View style={styles.secao}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Ionicons name="chevron-forward" size={18} color={Cores.textoTerciario} />
      </View>

      <FlatList
        data={animes}
        keyExtractor={(anime) => String(anime.id)}
        renderItem={({ item }) => <Cartaz anime={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fileira}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        // Informar a largura fixa de cada item evita que a lista precise medir
        // os cartazes durante a rolagem.
        getItemLayout={(_, indice) => ({
          length: LarguraCartaz.carrossel + Espacamento.md,
          offset: (LarguraCartaz.carrossel + Espacamento.md) * indice,
          index: indice,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { marginTop: Espacamento.xl },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espacamento.lg,
    marginBottom: Espacamento.md,
  },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.titulo,
    fontWeight: '700',
  },
  fileira: { paddingHorizontal: Espacamento.lg },
  separador: { width: Espacamento.md },
});
