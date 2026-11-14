import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CabecalhoTela } from '@/componentes/cabecalho-tela';
import { Carregando, MensagemErro, RodapePaginacao, Vazio } from '@/componentes/estado-tela';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { usePaginacao } from '@/hooks/use-paginacao';
import { catalogo } from '@/services/anilist';
import { comCache, MINUTO } from '@/services/cache';
import type { AnimeResumo, CriterioRanking } from '@/services/tipos';

const CRITERIOS: { valor: CriterioRanking; rotulo: string }[] = [
  { valor: 'em-alta', rotulo: 'Em alta' },
  { valor: 'temporada', rotulo: 'Temporada' },
  { valor: 'populares', rotulo: 'Populares' },
  { valor: 'melhores', rotulo: 'Melhores notas' },
];

/** Declarada fora do componente para ser a mesma funcao em toda renderizacao. */
const idDoAnime = (anime: AnimeResumo) => anime.id;

function LinhaRanking({ anime, posicao }: { anime: AnimeResumo; posicao: number }) {
  const detalhes = [
    anime.formato,
    anime.ano,
    anime.totalEpisodios ? `${anime.totalEpisodios} ep.` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.linha, pressed && styles.pressionado]}
      onPress={() => router.push({ pathname: '/anime/[id]', params: { id: anime.id } })}>
      <Text style={[styles.posicao, posicao <= 3 && styles.posicaoPodio]}>{posicao}</Text>

      <Image
        source={anime.capa}
        style={[styles.capa, anime.cor ? { backgroundColor: anime.cor } : null]}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.informacoes}>
        <Text style={styles.titulo} numberOfLines={2}>
          {anime.titulo}
        </Text>
        {detalhes ? <Text style={styles.detalhes}>{detalhes}</Text> : null}
        <Text style={styles.generos} numberOfLines={1}>
          {anime.generos.slice(0, 3).join(' · ')}
        </Text>
      </View>

      {anime.nota !== null ? (
        <View style={styles.nota}>
          <Ionicons name="star" size={12} color={Cores.dourado} />
          <Text style={styles.textoNota}>{anime.nota.toFixed(1)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Ranking de animes com quatro criterios de ordenacao.
 *
 * O criterio inicial pode chegar pela rota (o "Ver tudo" da tela inicial
 * abre /ranking?criterio=temporada). Cada pagina fica 30 minutos no cache, e
 * a lista cresce sozinha ao chegar perto do fim.
 */
export default function TelaRanking() {
  const params = useLocalSearchParams<{ criterio?: string }>();
  const recuo = useSafeAreaInsets();
  const [criterio, setCriterio] = useState<CriterioRanking>(
    CRITERIOS.find((item) => item.valor === params.criterio)?.valor ?? 'em-alta',
  );

  const buscarPagina = useCallback(
    (pagina: number, forcar: boolean) =>
      comCache(
        `ranking:${criterio}:${pagina}`,
        () => catalogo.ranking(criterio, pagina),
        30 * MINUTO,
        forcar,
      ),
    [criterio],
  );
  const lista = usePaginacao(criterio, buscarPagina, idDoAnime);

  return (
    <View style={styles.container}>
      <CabecalhoTela titulo="Ranking" subtitulo="Classificação dos usuários do AniList" />

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtros}>
          {CRITERIOS.map((item) => {
            const ativo = item.valor === criterio;
            return (
              <Pressable
                key={item.valor}
                style={[styles.filtro, ativo && styles.filtroAtivo]}
                onPress={() => setCriterio(item.valor)}>
                <Text style={[styles.textoFiltro, ativo && styles.textoFiltroAtivo]}>
                  {item.rotulo}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {lista.loading ? (
        <Carregando />
      ) : lista.erro ? (
        <MensagemErro mensagem={lista.erro} aoTentarDeNovo={lista.recarregar} />
      ) : (
        <FlatList
          data={lista.itens}
          keyExtractor={(anime) => String(anime.id)}
          renderItem={({ item, index }) => <LinhaRanking anime={item} posicao={index + 1} />}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          onEndReached={lista.carregarMais}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            <RodapePaginacao
              carregando={lista.carregandoMais}
              erro={lista.erroMais}
              aoTentarDeNovo={lista.carregarMais}
            />
          }
          ListEmptyComponent={<Vazio titulo="Nenhum título neste ranking" />}
          refreshControl={
            <RefreshControl
              refreshing={lista.atualizando}
              onRefresh={lista.atualizar}
              tintColor={Cores.marca}
              colors={[Cores.marca]}
            />
          }
          contentContainerStyle={{ paddingBottom: recuo.bottom + Espacamento.xl }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  filtros: {
    flexDirection: 'row',
    gap: Espacamento.sm,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md,
  },
  filtro: {
    paddingVertical: Espacamento.sm,
    paddingHorizontal: Espacamento.lg,
    borderRadius: Raio.pilula,
    borderWidth: 1,
    borderColor: Cores.divisoria,
    backgroundColor: Cores.superficie,
  },
  filtroAtivo: { backgroundColor: Cores.marca, borderColor: Cores.marca },
  textoFiltro: { color: Cores.textoSecundario, fontSize: Fonte.pequena, fontWeight: '700' },
  textoFiltroAtivo: { color: Cores.texto },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md,
  },
  pressionado: { opacity: 0.65 },
  posicao: {
    width: 32,
    color: Cores.textoTerciario,
    fontSize: Fonte.titulo,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  posicaoPodio: { color: Cores.marca },
  capa: { width: 60, height: 86, borderRadius: Raio.sm, backgroundColor: Cores.superficie },
  informacoes: { flex: 1, gap: 3 },
  titulo: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '700', lineHeight: 19 },
  detalhes: { color: Cores.textoSecundario, fontSize: Fonte.minuscula },
  generos: { color: Cores.textoTerciario, fontSize: Fonte.minuscula },
  nota: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  textoNota: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '700' },
  separador: { height: 1, backgroundColor: Cores.divisoria, marginLeft: 124 },
});
