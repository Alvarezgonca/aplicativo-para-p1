import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BarraSuperior } from '@/componentes/barra-superior';
import { Cartaz } from '@/componentes/cartaz';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useAlturaBarraAbas } from '@/hooks/use-altura-barra-abas';
import { useLarguraGrade } from '@/hooks/use-largura-grade';
import { useMinhaLista } from '@/contextos/minha-lista';
import { progressoDaSerie } from '@/dados/episodios';

const COLUNAS = 3;

export default function TelaLista() {
  const { animesSalvos, remover } = useMinhaLista();
  const alturaAbas = useAlturaBarraAbas();
  const larguraCartaz = useLarguraGrade(COLUNAS);
  const router = useRouter();

  /** Confirma antes de remover, por ser uma acao destrutiva. */
  const confirmarRemocao = (id: number, titulo: string) => {
    Alert.alert('Remover da lista', `Deseja tirar ${titulo} da sua lista?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => remover(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <BarraSuperior />

      <FlatList
        data={animesSalvos}
        keyExtractor={(anime) => String(anime.id)}
        numColumns={COLUNAS}
        columnWrapperStyle={animesSalvos.length > 0 ? styles.coluna : undefined}
        contentContainerStyle={[
          styles.conteudo,
          { paddingBottom: alturaAbas + Espacamento.xl },
          animesSalvos.length === 0 && styles.conteudoVazio,
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => confirmarRemocao(item.id, item.titulo)}
            delayLongPress={350}>
            <Cartaz
              anime={item}
              largura={larguraCartaz}
              mostrarNota={false}
              progresso={progressoDaSerie(item)}
            />
          </Pressable>
        )}
        ListHeaderComponent={
          animesSalvos.length > 0 ? (
            <View style={styles.cabecalho}>
              <Text style={styles.titulo}>Minha lista</Text>
              <View style={styles.linhaResumo}>
                <Text style={styles.subtitulo}>
                  {animesSalvos.length === 1
                    ? '1 titulo salvo'
                    : `${animesSalvos.length} titulos salvos`}
                </Text>
                <View style={styles.dica}>
                  <Ionicons name="hand-left-outline" size={12} color={Cores.textoTerciario} />
                  <Text style={styles.textoDica}>segure para remover</Text>
                </View>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="bookmark-outline" size={52} color={Cores.textoTerciario} />
            <Text style={styles.vazioTitulo}>Sua lista esta vazia</Text>
            <Text style={styles.vazioTexto}>
              Salve os titulos que quiser assistir depois e eles aparecem aqui.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
              onPress={() => router.push('/busca')}>
              <Text style={styles.textoBotao}>Explorar catalogo</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { paddingHorizontal: Espacamento.lg, paddingTop: Espacamento.sm },
  conteudoVazio: { flexGrow: 1, justifyContent: 'center' },
  coluna: { gap: Espacamento.md, marginBottom: Espacamento.xl },
  cabecalho: { marginBottom: Espacamento.xl },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.destaque,
    fontWeight: '800',
  },
  linhaResumo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Espacamento.xs,
  },
  subtitulo: {
    color: Cores.textoSecundario,
    fontSize: Fonte.minuscula,
    fontWeight: '600',
  },
  dica: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.xs },
  textoDica: { color: Cores.textoTerciario, fontSize: Fonte.minuscula },
  vazio: { alignItems: 'center', gap: Espacamento.sm, paddingHorizontal: Espacamento.xl },
  vazioTitulo: {
    color: Cores.texto,
    fontSize: Fonte.titulo,
    fontWeight: '700',
    marginTop: Espacamento.sm,
  },
  vazioTexto: {
    color: Cores.textoSecundario,
    fontSize: Fonte.pequena,
    textAlign: 'center',
    lineHeight: 20,
  },
  botao: {
    backgroundColor: Cores.marca,
    paddingVertical: Espacamento.md,
    paddingHorizontal: Espacamento.xl,
    borderRadius: Raio.sm,
    marginTop: Espacamento.lg,
  },
  pressionado: { opacity: 0.7 },
  textoBotao: {
    color: Cores.texto,
    fontSize: Fonte.corpo,
    fontWeight: '700',
  },
});
