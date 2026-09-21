import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { BarraSuperior } from '@/componentes/barra-superior';
import { Selo } from '@/componentes/selo';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useAlturaBarraAbas } from '@/hooks/use-altura-barra-abas';
import { animeDoLancamento, gradeSimulcast, type LancamentoSimulcast } from '@/dados/simulcast';

/**
 * A SectionList espera pares de titulo e dados. A grade semanal e convertida
 * para esse formato uma unica vez, fora do componente, por ser estatica.
 */
const secoes = gradeSimulcast.map((dia) => ({
  title: dia.dia,
  data: dia.lancamentos,
}));

function Lancamento({ lancamento }: { lancamento: LancamentoSimulcast }) {
  const anime = animeDoLancamento(lancamento);
  if (!anime) {
    return null;
  }

  return (
    <Link href={{ pathname: '/anime/[id]', params: { id: anime.id } }} asChild>
      <Pressable style={({ pressed }) => [styles.linha, pressed && styles.pressionada]}>
        <Image source={anime.capa} style={styles.capa} contentFit="cover" transition={200} />

        <View style={styles.informacoes}>
          <Text style={styles.tituloAnime} numberOfLines={2}>
            {anime.titulo}
          </Text>
          <Text style={styles.episodio}>
            Episodio {lancamento.episodio} · {lancamento.horario}
          </Text>

          <View style={styles.selos}>
            <Selo
              texto={lancamento.aguardando ? 'Em breve' : 'Disponivel'}
              variante={lancamento.aguardando ? 'contorno' : 'marca'}
            />
            {anime.dublado ? <Selo texto="Dublado" /> : null}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={Cores.textoTerciario} />
      </Pressable>
    </Link>
  );
}

export default function TelaSimulcast() {
  const alturaAbas = useAlturaBarraAbas();

  return (
    <View style={styles.container}>
      <BarraSuperior />

      <SectionList
        sections={secoes}
        keyExtractor={(item) => `${item.animeId}-${item.episodio}`}
        renderItem={({ item }) => <Lancamento lancamento={item} />}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.cabecalhoSecao}>
            <Text style={styles.textoSecao}>{section.title}</Text>
            <Text style={styles.contagemSecao}>
              {section.data.length === 1 ? '1 episodio' : `${section.data.length} episodios`}
            </Text>
          </View>
        )}
        // Mantem o cabecalho do dia colado no topo enquanto a secao rola.
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: alturaAbas + Espacamento.xl }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.cabecalho}>
            <Text style={styles.titulo}>Simulcast</Text>
            <Text style={styles.subtitulo}>
              Episodios novos liberados no mesmo dia da exibicao no Japao.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  cabecalho: {
    paddingHorizontal: Espacamento.lg,
    paddingTop: Espacamento.sm,
    paddingBottom: Espacamento.lg,
  },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.destaque,
    fontWeight: '800',
  },
  subtitulo: {
    color: Cores.textoSecundario,
    fontSize: Fonte.pequena,
    lineHeight: 19,
    marginTop: Espacamento.xs,
  },
  cabecalhoSecao: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    backgroundColor: Cores.fundo,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md,
    borderBottomWidth: 1,
    borderBottomColor: Cores.divisoria,
  },
  textoSecao: {
    color: Cores.texto,
    fontSize: Fonte.titulo,
    fontWeight: '700',
  },
  contagemSecao: {
    color: Cores.textoTerciario,
    fontSize: Fonte.minuscula,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.lg,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.lg,
  },
  pressionada: { backgroundColor: Cores.superficie },
  separador: {
    height: 1,
    backgroundColor: Cores.divisoria,
    marginLeft: Espacamento.lg + 68 + Espacamento.lg,
  },
  capa: {
    width: 68,
    height: 98,
    borderRadius: Raio.md,
    backgroundColor: Cores.superficie,
  },
  informacoes: { flex: 1, gap: 3 },
  tituloAnime: {
    color: Cores.texto,
    fontSize: Fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
  },
  episodio: {
    color: Cores.textoSecundario,
    fontSize: Fonte.pequena,
  },
  selos: { flexDirection: 'row', gap: Espacamento.xs, marginTop: Espacamento.xs },
});
