import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Cartaz, LarguraCartaz, type DadosCartaz } from '@/componentes/cartaz';
import { Cores, Espacamento, Fonte } from '@/constants/tema';

interface Props {
  titulo: string;
  animes: DadosCartaz[];
  /** Quando informado, o cabecalho vira um botao "Ver tudo". */
  aoVerTudo?: () => void;
}

/**
 * Secao horizontal com um titulo e uma fileira rolavel de cartazes.
 *
 * A fileira usa FlatList em vez de ScrollView porque a FlatList monta apenas
 * os itens visiveis, mantendo o custo constante independentemente do tamanho
 * da colecao.
 */
export function Carrossel({ titulo, animes, aoVerTudo }: Props) {
  if (animes.length === 0) {
    return null;
  }

  return (
    <View style={styles.secao}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>{titulo}</Text>
        {aoVerTudo ? (
          <Pressable style={styles.verTudo} onPress={aoVerTudo} hitSlop={8}>
            <Text style={styles.textoVerTudo}>Ver tudo</Text>
            <Ionicons name="chevron-forward" size={16} color={Cores.marca} />
          </Pressable>
        ) : null}
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
  verTudo: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  textoVerTudo: { color: Cores.marca, fontSize: Fonte.pequena, fontWeight: '700' },
  fileira: { paddingHorizontal: Espacamento.lg },
  separador: { width: Espacamento.md },
});
