import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Carregando, MensagemErro } from '@/componentes/estado-tela';
import { LinhaEpisodio } from '@/componentes/linha-episodio';
import { Selo } from '@/componentes/selo';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useMinhaLista } from '@/contextos/minha-lista';
import { useFetch } from '@/hooks/use-fetch';
import { catalogo } from '@/services/anilist';
import { comCache, MINUTO } from '@/services/cache';
import type { AnimeDetalhe } from '@/services/tipos';

type Aba = 'episodios' | 'sobre';

/** Texto curto para o tempo que falta ate o proximo episodio. */
function tempoAte(horario: number, agora: number): string {
  const minutos = Math.round((horario - agora) / MINUTO);
  if (minutos < 60) return 'em instantes';
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `em ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'amanhã' : `em ${dias} dias`;
}

/** Linhas da ficha tecnica, sem os campos que a API nao informou. */
function montarFicha(anime: AnimeDetalhe): [string, string][] {
  const linhas: [string, string | number | null][] = [
    ['Estúdio', anime.estudio],
    ['Formato', anime.formato],
    ['Situação', anime.situacao],
    ['Baseado em', anime.origem],
    ['Ano de estreia', anime.ano],
    ['Episódios', anime.totalEpisodios],
    ['Duração média', anime.duracao ? `${anime.duracao} min` : null],
    ['Título original', anime.tituloNativo],
  ];
  return linhas
    .filter((linha): linha is [string, string | number] => linha[1] !== null)
    .map(([rotulo, valor]) => [rotulo, String(valor)]);
}

/** Botao de voltar sobreposto ao banner, ja que a pilha esconde o cabecalho. */
function BotaoVoltar() {
  const router = useRouter();
  const recuo = useSafeAreaInsets();

  return (
    <Pressable
      style={[styles.voltar, { top: recuo.top + Espacamento.sm }]}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      hitSlop={10}
      accessibilityLabel="Voltar">
      <Ionicons name="arrow-back" size={22} color={Cores.texto} />
    </Pressable>
  );
}

/**
 * Detalhe de um anime.
 *
 * A rota recebe so o identificador (/anime/154587) e busca o restante na API,
 * em vez de receber o objeto inteiro por parametro: parametros de rota viajam
 * como texto, e buscar no destino garante dados atualizados.
 */
export default function TelaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animeId = Number(id);
  const router = useRouter();
  const recuo = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { estaSalvo, alternar } = useMinhaLista();
  const [sinopseExpandida, setSinopseExpandida] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<Aba>('episodios');
  const [agora] = useState(() => Date.now());

  const buscarAnime = useCallback(
    (forcar: boolean) =>
      comCache(`anime:${animeId}`, () => catalogo.anime(animeId), 30 * MINUTO, forcar),
    [animeId],
  );
  const { dados: anime, loading, erro, recarregar } = useFetch(buscarAnime);

  if (loading) {
    return (
      <View style={styles.container}>
        <Carregando />
        <BotaoVoltar />
      </View>
    );
  }

  if (erro || !anime) {
    return (
      <View style={styles.container}>
        <MensagemErro mensagem={erro ?? 'Título indisponível.'} aoTentarDeNovo={recarregar} />
        <BotaoVoltar />
      </View>
    );
  }

  const salvo = estaSalvo(anime.id);
  const primeiro = anime.episodios[0];

  function abrirEpisodio(numero: number) {
    router.push({
      pathname: '/player/[episodioId]',
      params: { episodioId: `${animeId}-${numero}` },
    });
  }

  const cabecalho = (
    <>
      <View style={[styles.banner, { height: Math.round(height * 0.38) }]}>
        <Image
          source={anime.banner ?? anime.capaGrande}
          style={[styles.imagemBanner, anime.cor ? { backgroundColor: anime.cor } : null]}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'transparent', Cores.fundo]}
          locations={[0, 0.45, 1]}
          style={styles.degrade}
        />
      </View>

      <View style={styles.corpo}>
        <Text style={styles.titulo}>{anime.titulo}</Text>
        {anime.tituloRomaji !== anime.titulo ? (
          <Text style={styles.tituloOriginal}>{anime.tituloRomaji}</Text>
        ) : null}

        <View style={styles.metadados}>
          {anime.nota !== null ? (
            <>
              <Ionicons name="star" size={13} color={Cores.dourado} />
              <Text style={styles.metaDestaque}>{anime.nota.toFixed(1)}</Text>
            </>
          ) : null}
          {[anime.ano, anime.formato, anime.totalEpisodios ? `${anime.totalEpisodios} ep.` : null]
            .filter(Boolean)
            .map((valor) => (
              <Text key={String(valor)} style={styles.meta}>
                {'  ·  '}
                {valor}
              </Text>
            ))}
        </View>

        <View style={styles.generos}>
          <Selo texto={anime.situacao} variante="marca" />
          {anime.generos.map((genero) => (
            <Selo key={genero} texto={genero} variante="contorno" />
          ))}
        </View>

        {anime.proximoEpisodio ? (
          <View style={styles.aviso}>
            <Ionicons name="calendar-outline" size={16} color={Cores.marca} />
            <Text style={styles.textoAviso}>
              Episódio {anime.proximoEpisodio.numero}{' '}
              {tempoAte(anime.proximoEpisodio.horario, agora)}
            </Text>
          </View>
        ) : null}

        {primeiro ? (
          <Pressable
            style={({ pressed }) => [styles.botaoAssistir, pressed && styles.pressionado]}
            onPress={() => abrirEpisodio(primeiro.numero)}>
            <Ionicons name="play" size={18} color={Cores.texto} />
            <Text style={styles.textoAssistir}>Assistir E{primeiro.numero}</Text>
          </Pressable>
        ) : null}

        <View style={styles.acoesSecundarias}>
          <Pressable style={styles.acao} onPress={() => alternar(anime.id)}>
            <Ionicons
              name={salvo ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={salvo ? Cores.marca : Cores.texto}
            />
            <Text style={[styles.textoAcao, salvo && styles.textoAcaoAtiva]}>
              {salvo ? 'Na lista' : 'Minha lista'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.abas}>
          {(['episodios', 'sobre'] as const).map((aba) => (
            <Pressable
              key={aba}
              style={[styles.aba, abaAtiva === aba && styles.abaAtiva]}
              onPress={() => setAbaAtiva(aba)}>
              <Text style={[styles.textoAba, abaAtiva === aba && styles.textoAbaAtiva]}>
                {aba === 'episodios' ? `Episódios (${anime.episodios.length})` : 'Sobre'}
              </Text>
            </Pressable>
          ))}
        </View>

        {abaAtiva === 'sobre' ? (
          <View style={styles.sobre}>
            {anime.sinopse ? (
              <Pressable onPress={() => setSinopseExpandida((atual) => !atual)}>
                <Text style={styles.sinopse} numberOfLines={sinopseExpandida ? undefined : 5}>
                  {anime.sinopse}
                </Text>
                <Text style={styles.verMais}>{sinopseExpandida ? 'Ver menos' : 'Ver mais'}</Text>
              </Pressable>
            ) : null}

            {montarFicha(anime).map(([rotulo, valor]) => (
              <View key={rotulo} style={styles.ficha}>
                <Text style={styles.fichaRotulo}>{rotulo}</Text>
                <Text style={styles.fichaValor}>{valor}</Text>
              </View>
            ))}
          </View>
        ) : anime.episodios.length === 0 ? (
          <Text style={styles.semEpisodios}>Nenhum episódio exibido até agora.</Text>
        ) : null}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={abaAtiva === 'episodios' ? anime.episodios : []}
        keyExtractor={(item) => String(item.numero)}
        renderItem={({ item }) => (
          <View style={styles.listaEpisodios}>
            <LinhaEpisodio
              episodio={item}
              duracao={anime.duracao}
              aoPressionar={() => abrirEpisodio(item.numero)}
            />
          </View>
        )}
        ListHeaderComponent={cabecalho}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        // Animes longos tem centenas de episodios: a FlatList monta so os visiveis.
        initialNumToRender={12}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: recuo.bottom + Espacamento.xxl }}
      />
      <BotaoVoltar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  listaEpisodios: { paddingHorizontal: Espacamento.lg },
  banner: { backgroundColor: Cores.superficie },
  imagemBanner: { width: '100%', height: '100%' },
  degrade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  corpo: { paddingHorizontal: Espacamento.lg, marginTop: -Espacamento.xl },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.heroi,
    fontWeight: '800',
    lineHeight: 33,
  },
  tituloOriginal: {
    color: Cores.textoTerciario,
    fontSize: Fonte.pequena,
    marginTop: Espacamento.xs,
  },
  metadados: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Espacamento.xs,
    marginTop: Espacamento.md,
  },
  meta: { color: Cores.textoSecundario, fontSize: Fonte.pequena },
  metaDestaque: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '700' },
  generos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.xs,
    marginTop: Espacamento.md,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    marginTop: Espacamento.md,
    padding: Espacamento.md,
    borderRadius: Raio.md,
    backgroundColor: Cores.superficie,
  },
  textoAviso: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '600' },
  botaoAssistir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.sm,
    backgroundColor: Cores.marca,
    paddingVertical: Espacamento.md + 2,
    borderRadius: Raio.sm,
    marginTop: Espacamento.lg,
  },
  pressionado: { opacity: 0.7 },
  textoAssistir: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '700' },
  acoesSecundarias: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Espacamento.lg,
  },
  acao: { alignItems: 'center', gap: Espacamento.xs, paddingVertical: Espacamento.sm },
  textoAcao: { color: Cores.textoSecundario, fontSize: Fonte.minuscula, fontWeight: '600' },
  textoAcaoAtiva: { color: Cores.marca },
  sinopse: {
    color: Cores.textoSecundario,
    fontSize: Fonte.corpo,
    lineHeight: 22,
    marginTop: Espacamento.lg,
  },
  verMais: {
    color: Cores.marca,
    fontSize: Fonte.pequena,
    fontWeight: '700',
    marginTop: Espacamento.sm,
  },
  semEpisodios: {
    color: Cores.textoTerciario,
    fontSize: Fonte.pequena,
    marginTop: Espacamento.lg,
  },
  separador: {
    height: 1,
    backgroundColor: Cores.divisoria,
    marginHorizontal: Espacamento.lg,
  },
  abas: {
    flexDirection: 'row',
    gap: Espacamento.xl,
    borderBottomWidth: 1,
    borderBottomColor: Cores.divisoria,
    marginTop: Espacamento.xl,
  },
  aba: { paddingBottom: Espacamento.md },
  abaAtiva: { borderBottomWidth: 2, borderBottomColor: Cores.marca },
  textoAba: {
    color: Cores.textoTerciario,
    fontSize: Fonte.corpo,
    fontWeight: '700',
  },
  textoAbaAtiva: { color: Cores.texto },
  sobre: { paddingBottom: Espacamento.lg },
  ficha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Espacamento.lg,
    borderTopWidth: 1,
    borderTopColor: Cores.divisoria,
    paddingTop: Espacamento.lg,
    marginTop: Espacamento.lg,
  },
  fichaRotulo: { color: Cores.textoTerciario, fontSize: Fonte.pequena },
  fichaValor: {
    flexShrink: 1,
    color: Cores.texto,
    fontSize: Fonte.pequena,
    fontWeight: '600',
    textAlign: 'right',
  },
  voltar: {
    position: 'absolute',
    left: Espacamento.lg,
    width: 36,
    height: 36,
    borderRadius: Raio.pilula,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
