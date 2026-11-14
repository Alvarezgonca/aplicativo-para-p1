import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraProgresso } from '@/componentes/barra-progresso';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { FRACAO_CONCLUIDO, useHistorico } from '@/contextos/historico';
import { useFetch } from '@/hooks/use-fetch';
import { catalogo } from '@/services/anilist';
import { comCache, MINUTO } from '@/services/cache';
import type { AnimeDetalhe, Episodio } from '@/services/tipos';

/** Quanto a reproducao simulada avanca a cada meio segundo. */
const PASSO = 0.005;

/** De quanto em quanto tempo o progresso e gravado no historico. */
const INTERVALO_GRAVACAO_MS = 5000;

/** Converte uma fracao do episodio em rotulo de tempo no formato m:ss. */
function formatarTempo(minutosTotais: number, fracao: number): string {
  const segundos = Math.round(minutosTotais * 60 * fracao);
  const minutos = Math.floor(segundos / 60);
  return `${minutos}:${String(segundos % 60).padStart(2, '0')}`;
}

interface PropsReprodutor {
  anime: AnimeDetalhe;
  episodio: Episodio;
  proximo: Episodio | undefined;
  progressoInicial: number;
}

/**
 * Reproducao simulada de um episodio.
 *
 * Nao ha video de verdade (o conteudo do servico original e protegido), entao
 * a miniatura do episodio ocupa a tela e a barra avanca sozinha. O que e real
 * e o registro: o progresso vai para o historico a cada poucos segundos e ao
 * sair da tela, e o usuario continua de onde parou na proxima vez.
 */
function Reprodutor({ anime, episodio, proximo, progressoInicial }: PropsReprodutor) {
  const router = useRouter();
  const recuo = useSafeAreaInsets();
  const { registrar } = useHistorico();
  const duracao = anime.duracao ?? 24;

  const [reproduzindo, setReproduzindo] = useState(true);
  const [progresso, setProgresso] = useState(progressoInicial);
  const [controlesVisiveis, setControlesVisiveis] = useState(true);

  /** Copia do progresso lida pelos temporizadores e pela gravacao ao sair. */
  const progressoAtual = useRef(progressoInicial);
  useEffect(() => {
    progressoAtual.current = progresso;
  }, [progresso]);

  const gravar = useCallback(() => {
    registrar({
      animeId: anime.id,
      titulo: anime.titulo,
      capa: anime.capa,
      banner: anime.banner,
      episodio: episodio.numero,
      tituloEpisodio: episodio.titulo,
      miniatura: episodio.miniatura,
      duracao,
      progresso: progressoAtual.current,
    });
  }, [anime, episodio, duracao, registrar]);

  /** Avanca a barra enquanto estiver tocando. */
  useEffect(() => {
    if (!reproduzindo) {
      return;
    }
    const temporizador = setInterval(() => {
      setProgresso((atual) => Math.min(atual + PASSO, 1));
    }, 500);
    return () => clearInterval(temporizador);
  }, [reproduzindo]);

  /** Grava o progresso de tempos em tempos enquanto toca. */
  useEffect(() => {
    if (!reproduzindo) {
      return;
    }
    const temporizador = setInterval(gravar, INTERVALO_GRAVACAO_MS);
    return () => clearInterval(temporizador);
  }, [reproduzindo, gravar]);

  /** Grava uma ultima vez quando o usuario sai do player. */
  useEffect(() => gravar, [gravar]);

  const concluido = progresso >= 1;

  function pausarOuContinuar() {
    if (concluido) {
      setProgresso(0);
      setReproduzindo(true);
      return;
    }
    if (reproduzindo) {
      gravar();
    }
    setReproduzindo((atual) => !atual);
  }

  function irParaProximo() {
    if (!proximo) {
      return;
    }
    gravar();
    // replace troca o episodio atual pelo proximo: o voltar leva ao detalhe,
    // e nao ao episodio anterior.
    router.replace({
      pathname: '/player/[animeId]',
      params: { animeId: anime.id, episodio: proximo.numero },
    });
  }

  return (
    <Pressable style={styles.container} onPress={() => setControlesVisiveis((atual) => !atual)}>
      <StatusBar hidden />

      {episodio.miniatura ? (
        <Image
          source={episodio.miniatura}
          style={styles.video}
          contentFit="cover"
          transition={300}
        />
      ) : null}

      {controlesVisiveis ? (
        <LinearGradient
          colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.85)']}
          locations={[0, 0.5, 1]}
          style={[
            styles.camada,
            {
              paddingTop: recuo.top + Espacamento.md,
              paddingBottom: recuo.bottom + Espacamento.lg,
            },
          ]}>
          <View style={styles.topo}>
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Fechar">
              <Ionicons name="chevron-down" size={26} color={Cores.texto} />
            </Pressable>
            <View style={styles.identificacao}>
              <Text style={styles.tituloAnime} numberOfLines={1}>
                {anime.titulo}
              </Text>
              <Text style={styles.tituloEpisodio} numberOfLines={1}>
                E{episodio.numero} · {episodio.titulo}
              </Text>
            </View>
          </View>

          <View style={styles.centro}>
            <Pressable
              hitSlop={12}
              onPress={() => setProgresso((atual) => Math.max(atual - 0.05, 0))}
              accessibilityLabel="Voltar um trecho">
              <Ionicons name="play-back" size={30} color={Cores.texto} />
            </Pressable>

            <Pressable
              style={styles.botaoCentral}
              onPress={pausarOuContinuar}
              accessibilityLabel={concluido ? 'Recomeçar' : reproduzindo ? 'Pausar' : 'Reproduzir'}>
              <Ionicons
                name={concluido ? 'refresh' : reproduzindo ? 'pause' : 'play'}
                size={34}
                color={Cores.texto}
              />
            </Pressable>

            <Pressable
              hitSlop={12}
              onPress={() => setProgresso((atual) => Math.min(atual + 0.05, 1))}
              accessibilityLabel="Avançar um trecho">
              <Ionicons name="play-forward" size={30} color={Cores.texto} />
            </Pressable>
          </View>

          <View style={styles.base}>
            <BarraProgresso progresso={progresso} altura={4} />
            <View style={styles.tempos}>
              <Text style={styles.tempo}>{formatarTempo(duracao, progresso)}</Text>
              <Text style={styles.tempo}>{formatarTempo(duracao, 1)}</Text>
            </View>

            <View style={styles.opcoes}>
              <Text style={styles.situacao}>
                {progresso >= FRACAO_CONCLUIDO
                  ? 'Episódio assistido'
                  : 'Progresso salvo no aparelho'}
              </Text>
              {proximo ? (
                <Pressable style={styles.opcao} onPress={irParaProximo}>
                  <Text style={styles.textoOpcao}>Próximo: E{proximo.numero}</Text>
                  <Ionicons name="play-skip-forward" size={18} color={Cores.texto} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </LinearGradient>
      ) : null}
    </Pressable>
  );
}

/**
 * Rota /player/[animeId]?episodio=3.
 *
 * Recebe so os numeros e busca o anime pelo cache, que a tela de detalhe ja
 * preencheu; por isso o player abre sem esperar a rede.
 */
export default function TelaPlayer() {
  const params = useLocalSearchParams<{ animeId: string; episodio?: string }>();
  const animeId = Number(params.animeId);
  const numero = Number(params.episodio ?? 1);
  const router = useRouter();
  const { progressoDe, carregado } = useHistorico();

  const buscarAnime = useCallback(
    (forcar: boolean) =>
      comCache(`anime:${animeId}`, () => catalogo.anime(animeId), 30 * MINUTO, forcar),
    [animeId],
  );
  const { dados: anime, loading, erro } = useFetch(buscarAnime);

  if (loading || !carregado) {
    return (
      <View style={styles.erro}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color={Cores.marca} />
      </View>
    );
  }

  const indice = anime ? anime.episodios.findIndex((item) => item.numero === numero) : -1;

  if (erro || !anime || indice === -1) {
    return (
      <View style={styles.erro}>
        <StatusBar hidden />
        <Text style={styles.textoErro}>{erro ?? 'Episódio indisponível.'}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.linkVoltar}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const ja = progressoDe(anime.id, numero);

  return (
    <Reprodutor
      // A chave faz o React criar um player novo a cada episodio, com o
      // progresso inicial daquele episodio.
      key={`${anime.id}-${numero}`}
      anime={anime}
      episodio={anime.episodios[indice]}
      proximo={anime.episodios[indice + 1]}
      // Episodio ja terminado recomeca do inicio.
      progressoInicial={ja >= FRACAO_CONCLUIDO ? 0 : ja}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  video: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  camada: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    paddingTop: Espacamento.lg,
  },
  identificacao: { flex: 1 },
  tituloAnime: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '700' },
  tituloEpisodio: { color: Cores.textoSecundario, fontSize: Fonte.minuscula, marginTop: 2 },
  centro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.xxl,
  },
  botaoCentral: {
    width: 68,
    height: 68,
    borderRadius: Raio.pilula,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  base: { paddingHorizontal: Espacamento.lg, gap: Espacamento.sm },
  tempos: { flexDirection: 'row', justifyContent: 'space-between' },
  tempo: { color: Cores.textoSecundario, fontSize: Fonte.minuscula, fontVariant: ['tabular-nums'] },
  opcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Espacamento.md,
  },
  situacao: { color: Cores.textoTerciario, fontSize: Fonte.minuscula },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.xs },
  textoOpcao: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '700' },
  erro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.md,
    backgroundColor: '#000000',
  },
  textoErro: { color: Cores.textoSecundario, fontSize: Fonte.corpo },
  linkVoltar: { color: Cores.marca, fontSize: Fonte.corpo, fontWeight: '700' },
});
