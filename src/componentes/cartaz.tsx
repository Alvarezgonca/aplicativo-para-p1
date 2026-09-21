import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import type { Anime } from '@/dados/animes';

/**
 * Largura padrao do cartaz nos carrosseis. Nas grades a largura e calculada a
 * partir da largura da janela pelo hook useLarguraGrade.
 */
export const LarguraCartaz = { carrossel: 124 } as const;

interface Props {
  anime: Anime;
  largura?: number;
  /** Exibe titulo, nota e selo de dublagem abaixo da imagem. */
  mostrarLegenda?: boolean;
}

/**
 * Poster vertical de um anime, usado nos carrosseis da tela inicial, na grade
 * da lista salva e nos resultados de busca.
 *
 * O componente e um link para a rota de detalhe; a navegacao fica a cargo do
 * Expo Router, sem que a tela de origem precise saber para onde ir.
 */
export function Cartaz({ anime, largura = LarguraCartaz.carrossel, mostrarLegenda = true }: Props) {
  return (
    <Link href={{ pathname: '/anime/[id]', params: { id: anime.id } }} asChild>
      <Pressable style={({ pressed }) => [{ width: largura }, pressed && styles.pressionado]}>
        <View style={[styles.moldura, { height: largura * 1.45 }]}>
          <Image
            source={anime.capa}
            style={styles.imagem}
            contentFit="cover"
            transition={200}
          />
          {anime.dublado ? (
            <View style={styles.etiquetaDublado}>
              <Text style={styles.textoDublado}>DUB</Text>
            </View>
          ) : null}
        </View>

        {mostrarLegenda ? (
          <View style={styles.legenda}>
            <Text style={styles.titulo} numberOfLines={2}>
              {anime.titulo}
            </Text>
            <View style={styles.linhaNota}>
              <Ionicons name="star" size={11} color={Cores.dourado} />
              <Text style={styles.nota}>{anime.nota.toFixed(1)}</Text>
            </View>
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressionado: { opacity: 0.65 },
  moldura: {
    width: '100%',
    borderRadius: Raio.md,
    overflow: 'hidden',
    backgroundColor: Cores.superficie,
  },
  imagem: { width: '100%', height: '100%' },
  etiquetaDublado: {
    position: 'absolute',
    top: Espacamento.xs,
    left: Espacamento.xs,
    backgroundColor: Cores.marca,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Raio.sm,
  },
  textoDublado: {
    color: Cores.texto,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  legenda: { marginTop: Espacamento.sm, gap: 2 },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.pequena,
    fontWeight: '600',
    lineHeight: 17,
  },
  linhaNota: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  nota: {
    color: Cores.textoSecundario,
    fontSize: Fonte.minuscula,
    fontWeight: '600',
  },
});
