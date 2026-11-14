import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Carrossel } from '@/componentes/carrossel';
import { Carregando, MensagemErro } from '@/componentes/estado-tela';
import { LinhaEpisodio } from '@/componentes/linha-episodio';
import { Selo } from '@/componentes/selo';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { FRACAO_CONCLUIDO, useHistorico, type RegistroHistorico } from '@/contextos/historico';
import { useMinhaLista } from '@/contextos/minha-lista';
import { usePreferencias } from '@/contextos/preferencias';
import { useFetch } from '@/hooks/use-fetch';
import { catalogo } from '@/services/anilist';
import { comCache, MINUTO } from '@/services/cache';
import type { AnimeDetalhe, Episodio } from '@/services/tipos';

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
/**
 * Decide o episodio do botao principal a partir do historico deste anime:
 * o ultimo episodio aberto se ficou pela metade, o seguinte se ele terminou,
 * ou o primeiro quando o anime ainda nao foi assistido.
 */
function sugerirEpisodio(
  episodios: Episodio[],
  ultimo: RegistroHistorico | undefined,
): { episodio: Episodio; continuar: boolean } | null {
  if (episodios.length === 0) {
    return null;
  }
  const indice = ultimo ? episodios.findIndex((item) => item.numero === ultimo.episodio) : -1;
  if (ultimo && indice !== -1) {
    if (ultimo.progresso < FRACAO_CONCLUIDO) {
      return { episodio: episodios[indice], continuar: true };
    }
    if (episodios[indice + 1]) {
      return { episodio: episodios[indice + 1], continuar: false };
    }
  }
  return { episodio: episodios[0], continuar: false };
}

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
  const { registros, progressoDe } = useHistorico();
  const { tituloDe } = usePreferencias();
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
  const titulo = tituloDe(anime);
  const subtitulo = titulo === anime.titulo ? anime.tituloRomaji : anime.titulo;
  const sugerido = sugerirEpisodio(
    anime.episodios,
    registros.find((item) => item.animeId === anime.id),
  );

  /**
   * Abre o trailer no navegador interno do aparelho (expo-web-browser). O
   * usuario assiste e volta para o aplicativo no mesmo ponto, sem sair dele.
   */
  function abrirTrailer(codigo: string) {
    WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${codigo}`);
  }

  /** Abre a folha de compartilhamento nativa (WhatsApp, e-mail, copiar...). */
  function compartilhar(titulo: string) {
    Share.share({
      message: `Estou de olho em ${titulo}: https://anilist.co/anime/${animeId}`,
    }).catch(() => {
      // O usuario fechou a folha ou o navegador nao tem compartilhamento.
    });
  }

  function abrirEpisodio(numero: number) {
    router.push({ pathname: '/player/[animeId]', params: { animeId, episodio: numero } });
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
        <Text style={styles.titulo}>{titulo}</Text>
        {/* Embaixo vai o outro nome: o romaji, ou o ingles se o romaji ja e o principal. */}
        {subtitulo !== titulo ? <Text style={styles.tituloOriginal}>{subtitulo}</Text> : null}

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

        {sugerido ? (
          <Pressable
            style={({ pressed }) => [styles.botaoAssistir, pressed && styles.pressionado]}
            onPress={() => abrirEpisodio(sugerido.episodio.numero)}>
            <Ionicons name="play" size={18} color={Cores.texto} />
            <Text style={styles.textoAssistir}>
              {sugerido.continuar ? 'Continuar' : 'Assistir'} E{sugerido.episodio.numero}
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.acoesSecundarias}>
          <Pressable style={styles.acao} onPress={() => alternar(anime)}>
            <Ionicons
              name={salvo ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={salvo ? Cores.marca : Cores.texto}
            />
            <Text style={[styles.textoAcao, salvo && styles.textoAcaoAtiva]}>
              {salvo ? 'Na lista' : 'Minha lista'}
            </Text>
          </Pressable>

          {anime.trailer ? (
            <Pressable
              style={styles.acao}
              onPress={() => anime.trailer && abrirTrailer(anime.trailer)}>
              <Ionicons name="logo-youtube" size={22} color={Cores.texto} />
              <Text style={styles.textoAcao}>Trailer</Text>
            </Pressable>
          ) : null}

          <Pressable style={styles.acao} onPress={() => compartilhar(anime.titulo)}>
            <Ionicons name="share-social-outline" size={22} color={Cores.texto} />
            <Text style={styles.textoAcao}>Compartilhar</Text>
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

            {anime.personagens.length > 0 ? (
              <View style={styles.secao}>
                <View style={styles.cabecalhoSecao}>
                  <Text style={styles.tituloSecao}>Personagens</Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                      router.push({ pathname: '/anime/[id]/personagens', params: { id: animeId } })
                    }>
                    <Text style={styles.verTodos}>Ver todos</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.fileira}>
                  {anime.personagens.map((personagem) => (
                    <Pressable
                      key={personagem.id}
                      style={styles.personagem}
                      onPress={() =>
                        router.push({ pathname: '/personagem/[id]', params: { id: personagem.id } })
                      }>
                      <Image
                        source={personagem.imagem}
                        style={styles.fotoPersonagem}
                        contentFit="cover"
                        transition={200}
                      />
                      <Text style={styles.nomePersonagem} numberOfLines={2}>
                        {personagem.nome}
                      </Text>
                      <Text style={styles.papelPersonagem}>{personagem.papel}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
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
              progresso={progressoDe(anime.id, item.numero)}
              aoPressionar={() => abrirEpisodio(item.numero)}
            />
          </View>
        )}
        ListHeaderComponent={cabecalho}
        ListFooterComponent={
          abaAtiva === 'sobre' ? (
            <Carrossel titulo="Você também pode gostar" animes={anime.recomendacoes} />
          ) : undefined
        }
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
  secao: { marginTop: Espacamento.xl },
  cabecalhoSecao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Espacamento.md,
  },
  tituloSecao: { color: Cores.texto, fontSize: Fonte.titulo, fontWeight: '700' },
  verTodos: { color: Cores.marca, fontSize: Fonte.pequena, fontWeight: '700' },
  fileira: { gap: Espacamento.md },
  personagem: { width: 84, alignItems: 'center' },
  fotoPersonagem: {
    width: 72,
    height: 72,
    borderRadius: Raio.pilula,
    backgroundColor: Cores.superficie,
  },
  nomePersonagem: {
    color: Cores.texto,
    fontSize: Fonte.minuscula,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: Espacamento.sm,
  },
  papelPersonagem: { color: Cores.textoTerciario, fontSize: 10, marginTop: 2 },
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
