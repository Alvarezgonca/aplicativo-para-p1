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
          <Text style={styles.titulo} numberOfLines={2}>
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
          <Text style={styles.intro}>
            Episodios novos liberados no mesmo dia da exibicao no Japao.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  intro: {
    color: Cores.textoSecundario,
    fontSize: Fonte.pequena,
    paddingHorizontal: Espacamento.lg,
    paddingBottom: Espacamento.lg,
    lineHeight: 19,
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
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md,
  },
  pressionada: { backgroundColor: Cores.superficie },
  capa: {
    width: 56,
    height: 80,
    borderRadius: Raio.sm,
    backgroundColor: Cores.superficie,
  },
  informacoes: { flex: 1, gap: 3 },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.corpo,
    fontWeight: '600',
  },
  episodio: {
    color: Cores.textoSecundario,
    fontSize: Fonte.pequena,
  },
  selos: { flexDirection: 'row', gap: Espacamento.xs, marginTop: Espacamento.xs },
});
