import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { usePreferencias } from '@/contextos/preferencias';

const ALTURA = Math.round(Dimensions.get('window').height * 0.52);
const INTERVALO_MS = 6000;

/** Campos de um anime usados pelo banner. */
export interface DadosDestaque {
  id: number;
  titulo: string;
  tituloRomaji?: string;
  tituloNativo?: string | null;
  banner: string | null;
  generos: string[];
}

/**
 * Banner superior da tela inicial.
 *
 * Alterna automaticamente entre os titulos recebidos pela propriedade animes.
 * O indice atual fica em estado local e e avancado por um temporizador criado
 * no useEffect; a funcao de limpeza cancela o temporizador quando o componente
 * sai de tela, evitando atualizacao de estado em componente desmontado.
 */
export function Destaque({ animes }: { animes: DadosDestaque[] }) {
  const [indice, setIndice] = useState(0);
  const { tituloDe } = usePreferencias();
  const router = useRouter();
  const total = animes.length;

  useEffect(() => {
    if (total < 2) {
      return;
    }
    const temporizador = setInterval(() => {
      setIndice((atual) => (atual + 1) % total);
    }, INTERVALO_MS);

    return () => clearInterval(temporizador);
  }, [total]);

  if (total === 0) {
    return null;
  }

  // Se a lista encolher ao recarregar, o indice antigo pode ficar fora dela.
  const anime = animes[indice % total];

  return (
    <View style={styles.container}>
      <Image
        source={anime.banner ?? undefined}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={400}
      />

      {/* Degrade escuro na base para garantir contraste do texto sobre a arte. */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)', Cores.fundo]}
        locations={[0.25, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.conteudo}>
        <Text style={styles.titulo} numberOfLines={2}>
          {tituloDe(anime)}
        </Text>

        <Text style={styles.generos}>{anime.generos.join('  •  ')}</Text>

        <View style={styles.acoes}>
          <Pressable
            style={({ pressed }) => [styles.botaoPrincipal, pressed && styles.pressionado]}
            onPress={() => router.push({ pathname: '/anime/[id]', params: { id: anime.id } })}>
            <Ionicons name="play" size={16} color={Cores.texto} />
            <Text style={styles.textoBotaoPrincipal}>Assistir</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.botaoSecundario, pressed && styles.pressionado]}
            onPress={() => router.push({ pathname: '/anime/[id]', params: { id: anime.id } })}>
            <Ionicons name="information-circle-outline" size={18} color={Cores.texto} />
            <Text style={styles.textoBotaoSecundario}>Detalhes</Text>
          </Pressable>
        </View>

        {/* Indicadores de posicao, um por titulo em destaque. */}
        <View style={styles.indicadores}>
          {animes.map((item, posicao) => (
            <View
              key={item.id}
              style={[styles.ponto, posicao === indice % total && styles.pontoAtivo]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: ALTURA, justifyContent: 'flex-end' },
  conteudo: { paddingHorizontal: Espacamento.lg, paddingBottom: Espacamento.md },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.heroi,
    fontWeight: '800',
    lineHeight: 34,
  },
  generos: {
    color: Cores.textoSecundario,
    fontSize: Fonte.pequena,
    fontWeight: '600',
    marginTop: Espacamento.sm,
  },
  acoes: {
    flexDirection: 'row',
    gap: Espacamento.md,
    marginTop: Espacamento.lg,
  },
  pressionado: { opacity: 0.7 },
  botaoPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    backgroundColor: Cores.marca,
    paddingVertical: Espacamento.md,
    paddingHorizontal: Espacamento.xl,
    borderRadius: Raio.sm,
  },
  textoBotaoPrincipal: {
    color: Cores.texto,
    fontSize: Fonte.corpo,
    fontWeight: '700',
  },
  botaoSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    borderRadius: Raio.sm,
  },
  textoBotaoSecundario: {
    color: Cores.texto,
    fontSize: Fonte.corpo,
    fontWeight: '600',
  },
  indicadores: {
    flexDirection: 'row',
    gap: Espacamento.xs,
    marginTop: Espacamento.lg,
    justifyContent: 'center',
  },
  ponto: {
    width: 6,
    height: 6,
    borderRadius: Raio.pilula,
    backgroundColor: Cores.textoTerciario,
  },
  pontoAtivo: { backgroundColor: Cores.marca, width: 18 },
});
