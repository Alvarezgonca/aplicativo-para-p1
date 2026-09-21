import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { BarraSuperior } from '@/componentes/barra-superior';
import { Selo } from '@/componentes/selo';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useAlturaBarraAbas } from '@/hooks/use-altura-barra-abas';
import { animeDoLancamento, gradeSimulcast, type LancamentoSimulcast } from '@/dados/simulcast';

/** Ordem dos dias conforme o indice devolvido por Date.getDay. */
const ORDEM_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terca-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sabado',
];

/** Quantos dias faltam, a partir de hoje, para o proximo dia com esse rotulo. */
function distanciaEmDias(rotulo: string, hoje: Date): number {
  return (ORDEM_SEMANA.indexOf(rotulo) - hoje.getDay() + 7) % 7;
}

function formatarData(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}`;
}

function CartaoLancamento({ lancamento }: { lancamento: LancamentoSimulcast }) {
  const anime = animeDoLancamento(lancamento);
  if (!anime) {
    return null;
  }

  return (
    <Link href={{ pathname: '/anime/[id]', params: { id: anime.id } }} asChild>
      <Pressable style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}>
        <View style={styles.moldura}>
          <Image
            source={anime.banner}
            style={styles.miniatura}
            contentFit="cover"
            transition={200}
          />

          {/* Episodios ainda nao liberados ficam escurecidos, com relogio. */}
          {lancamento.aguardando ? (
            <View style={styles.veu}>
              <Ionicons name="time-outline" size={20} color={Cores.texto} />
            </View>
          ) : null}

          <View style={[styles.horario, lancamento.aguardando && styles.horarioAguardando]}>
            <Text style={styles.textoHorario}>{lancamento.horario}</Text>
          </View>
        </View>

        <View style={styles.informacoes}>
          <Text style={styles.tituloAnime} numberOfLines={2}>
            {anime.titulo}
          </Text>

          <Text style={styles.episodio}>
            Episodio {lancamento.episodio} · {anime.duracaoMedia} min
          </Text>

          <View style={styles.selos}>
            {lancamento.aguardando ? (
              <Selo texto="Em breve" variante="contorno" />
            ) : (
              <Selo texto="Novo" variante="marca" />
            )}
            {anime.dublado ? <Selo texto="Dublado" /> : null}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default function TelaSimulcast() {
  const alturaAbas = useAlturaBarraAbas();

  /**
   * Converte a grade para o formato de secoes da SectionList e associa a cada
   * dia a data real da proxima ocorrencia, contada a partir de hoje. O calculo
   * fica em useMemo para nao refazer a cada renderizacao.
   */
  const secoes = useMemo(() => {
    const hoje = new Date();

    return gradeSimulcast.map((dia) => {
      const distancia = distanciaEmDias(dia.dia, hoje);
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + distancia);

      return {
        title: dia.dia,
        data: dia.lancamentos,
        rotuloData: formatarData(data),
        hoje: distancia === 0,
      };
    });
  }, []);

  return (
    <View style={styles.container}>
      <BarraSuperior />

      <SectionList
        sections={secoes}
        keyExtractor={(item) => `${item.animeId}-${item.episodio}`}
        renderItem={({ item }) => <CartaoLancamento lancamento={item} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.cabecalhoSecao}>
            <View style={styles.identificacaoDia}>
              <Text style={[styles.nomeDia, section.hoje && styles.nomeDiaHoje]}>
                {section.title}
              </Text>
              <Text style={styles.dataDia}>{section.rotuloData}</Text>
            </View>
            {section.hoje ? <Selo texto="HOJE" variante="marca" /> : null}
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
  titulo: { color: Cores.texto, fontSize: Fonte.destaque, fontWeight: '800' },
  subtitulo: {
    color: Cores.textoSecundario,
    fontSize: Fonte.pequena,
    lineHeight: 19,
    marginTop: Espacamento.xs,
  },

  cabecalhoSecao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Cores.fundo,
    paddingHorizontal: Espacamento.lg,
    paddingTop: Espacamento.lg,
    paddingBottom: Espacamento.sm,
  },
  identificacaoDia: { flexDirection: 'row', alignItems: 'baseline', gap: Espacamento.sm },
  nomeDia: {
    color: Cores.texto,
    fontSize: Fonte.minuscula,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  nomeDiaHoje: { color: Cores.marca },
  dataDia: { color: Cores.textoTerciario, fontSize: Fonte.minuscula },

  cartao: {
    flexDirection: 'row',
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md,
  },
  pressionado: { opacity: 0.7 },
  moldura: {
    width: 124,
    height: 70,
    borderRadius: Raio.md,
    overflow: 'hidden',
    backgroundColor: Cores.superficie,
  },
  miniatura: { width: '100%', height: '100%' },
  veu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horario: {
    position: 'absolute',
    left: Espacamento.xs,
    bottom: Espacamento.xs,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Raio.sm,
  },
  horarioAguardando: { backgroundColor: 'rgba(0,0,0,0.5)' },
  textoHorario: {
    color: Cores.texto,
    fontSize: Fonte.minuscula,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  informacoes: { flex: 1, justifyContent: 'center', gap: Espacamento.xs },
  tituloAnime: {
    color: Cores.texto,
    fontSize: Fonte.pequena,
    fontWeight: '700',
    lineHeight: 18,
  },
  episodio: { color: Cores.textoSecundario, fontSize: Fonte.minuscula },
  selos: { flexDirection: 'row', gap: Espacamento.xs, marginTop: 2 },
});
