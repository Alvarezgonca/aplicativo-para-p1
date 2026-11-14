import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BarraProgresso } from '@/componentes/barra-progresso';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import type { Anime } from '@/dados/animes';
import type { Episodio } from '@/dados/episodios';

interface Props {
  anime: Anime;
  episodio: Episodio;
}

/**
 * Cartao horizontal da fileira de continuidade.
 *
 * Diferente do cartaz vertical, usa a miniatura horizontal do episodio e leva
 * direto para a reproducao, sem passar pela tela de detalhe.
 */
export function CartaoContinuar({ anime, episodio }: Props) {
  const router = useRouter();
  const minutosRestantes = Math.max(1, Math.round(episodio.duracao * (1 - episodio.progresso)));

  return (
    <Pressable
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
      onPress={() =>
        router.push({
          pathname: '/player/[animeId]',
          params: { animeId: anime.id, episodio: episodio.numero },
        })
      }>
      <View style={styles.moldura}>
        <Image
          source={episodio.miniatura}
          style={styles.imagem}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.iconePlay}>
          <Ionicons name="play" size={18} color={Cores.texto} />
        </View>
        <View style={styles.progresso}>
          <BarraProgresso progresso={episodio.progresso} />
        </View>
      </View>

      <Text style={styles.titulo} numberOfLines={1}>
        {anime.titulo}
      </Text>
      <Text style={styles.detalhe} numberOfLines={1}>
        E{episodio.numero} · faltam {minutosRestantes} min
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: { width: 220 },
  pressionado: { opacity: 0.7 },
  moldura: {
    width: '100%',
    height: 124,
    borderRadius: Raio.md,
    overflow: 'hidden',
    backgroundColor: Cores.superficie,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagem: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  iconePlay: {
    width: 40,
    height: 40,
    borderRadius: Raio.pilula,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progresso: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.pequena,
    fontWeight: '600',
    marginTop: Espacamento.sm,
  },
  detalhe: {
    color: Cores.textoTerciario,
    fontSize: Fonte.minuscula,
    marginTop: 2,
  },
});
