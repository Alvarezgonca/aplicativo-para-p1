import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraProgresso } from '@/componentes/barra-progresso';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { buscarAnimePorId } from '@/dados/animes';
import { listarEpisodios } from '@/dados/episodios';

/** Converte uma fracao do episodio em rotulo de tempo no formato m:ss. */
function formatarTempo(minutosTotais: number, fracao: number): string {
  const segundos = Math.round(minutosTotais * 60 * fracao);
  const minutos = Math.floor(segundos / 60);
  return `${minutos}:${String(segundos % 60).padStart(2, '0')}`;
}

export default function TelaPlayer() {
  const { episodioId } = useLocalSearchParams<{ episodioId: string }>();
  const router = useRouter();
  const recuo = useSafeAreaInsets();

  // O identificador do episodio tem o formato "animeId-numero".
  const [animeId] = String(episodioId).split('-').map(Number);
  const anime = buscarAnimePorId(animeId);
  const episodio = listarEpisodios(animeId).find((item) => item.id === episodioId);

  const [reproduzindo, setReproduzindo] = useState(true);
  const [progresso, setProgresso] = useState(episodio?.progresso ?? 0);
  const [controlesVisiveis, setControlesVisiveis] = useState(true);

  /**
   * Avanca a reproducao simulada enquanto estiver tocando. O temporizador e
   * recriado sempre que o estado de reproducao muda e cancelado na saida.
   */
  useEffect(() => {
    if (!reproduzindo) {
      return;
    }
    const temporizador = setInterval(() => {
      setProgresso((atual) => Math.min(atual + 0.005, 1));
    }, 500);

    return () => clearInterval(temporizador);
  }, [reproduzindo]);

  if (!anime || !episodio) {
    return (
      <View style={styles.erro}>
        <StatusBar hidden />
        <Text style={styles.textoErro}>Episodio indisponivel.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.linkVoltar}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const concluido = progresso >= 1;

  return (
    <Pressable
      style={styles.container}
      onPress={() => setControlesVisiveis((atual) => !atual)}>
      {/* A barra de status some para a reproducao ocupar a tela inteira. */}
      <StatusBar hidden />

      <Image source={episodio.miniatura} style={styles.video} contentFit="cover" transition={300} />

      {controlesVisiveis ? (
        <LinearGradient
          colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.85)']}
          locations={[0, 0.5, 1]}
          style={[
            styles.camada,
            { paddingTop: recuo.top + Espacamento.md, paddingBottom: recuo.bottom + Espacamento.lg },
          ]}>
          <View style={styles.topo}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
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
            <Pressable hitSlop={10}>
              <Ionicons name="ellipsis-vertical" size={20} color={Cores.texto} />
            </Pressable>
          </View>

          <View style={styles.centro}>
            <Pressable
              hitSlop={12}
              onPress={() => setProgresso((atual) => Math.max(atual - 0.05, 0))}>
              <Ionicons name="play-back" size={30} color={Cores.texto} />
            </Pressable>

            <Pressable
              style={styles.botaoCentral}
              onPress={() => {
                if (concluido) {
                  setProgresso(0);
                  setReproduzindo(true);
                  return;
                }
                setReproduzindo((atual) => !atual);
              }}>
              <Ionicons
                name={concluido ? 'refresh' : reproduzindo ? 'pause' : 'play'}
                size={34}
                color={Cores.texto}
              />
            </Pressable>

            <Pressable
              hitSlop={12}
              onPress={() => setProgresso((atual) => Math.min(atual + 0.05, 1))}>
              <Ionicons name="play-forward" size={30} color={Cores.texto} />
            </Pressable>
          </View>

          <View style={styles.base}>
            <BarraProgresso progresso={progresso} altura={4} />
            <View style={styles.tempos}>
              <Text style={styles.tempo}>{formatarTempo(episodio.duracao, progresso)}</Text>
              <Text style={styles.tempo}>{formatarTempo(episodio.duracao, 1)}</Text>
            </View>

            <View style={styles.opcoes}>
              <View style={styles.opcao}>
                <Ionicons name="chatbox-ellipses-outline" size={18} color={Cores.texto} />
                <Text style={styles.textoOpcao}>Legendas</Text>
              </View>
              <View style={styles.opcao}>
                <Ionicons name="settings-outline" size={18} color={Cores.texto} />
                <Text style={styles.textoOpcao}>Qualidade</Text>
              </View>
              <View style={styles.opcao}>
                <Ionicons name="play-skip-forward-outline" size={18} color={Cores.texto} />
                <Text style={styles.textoOpcao}>Proximo</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      ) : null}
    </Pressable>
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
    justifyContent: 'space-between',
    marginTop: Espacamento.md,
  },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.xs },
  textoOpcao: { color: Cores.texto, fontSize: Fonte.minuscula, fontWeight: '600' },
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
