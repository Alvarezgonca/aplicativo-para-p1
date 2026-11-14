import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BarraProgresso } from '@/componentes/barra-progresso';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';

/**
 * Largura padrao do cartaz nos carrosseis. Nas grades a largura e calculada a
 * partir da largura da janela pelo hook useLarguraGrade.
 */
export const LarguraCartaz = { carrossel: 124 } as const;

/**
 * O que o cartaz precisa saber de um anime. O tipo e declarado aqui, e nao
 * importado do catalogo, para que o componente aceite qualquer origem de
 * dados que tenha esses campos: a API, a lista salva ou o historico.
 */
export interface DadosCartaz {
  id: number;
  titulo: string;
  capa: string;
  /** Nota de 0 a 10; nula quando o titulo ainda nao foi avaliado. */
  nota: number | null;
  /** Cor de fundo exibida enquanto a imagem carrega. */
  cor?: string | null;
  dublado?: boolean;
}

interface Props {
  anime: DadosCartaz;
  largura?: number;
  /** Exibe a legenda abaixo da imagem. */
  mostrarLegenda?: boolean;
  /** Exibe a nota na legenda. Desligado nas grades, onde polui em largura pequena. */
  mostrarNota?: boolean;
  /** Fracao ja assistida da serie. Quando informada, desenha a barra na base. */
  progresso?: number;
}

/**
 * Poster vertical de um anime, usado nos carrosseis da tela inicial, na grade
 * da lista salva e nos resultados de busca.
 *
 * O componente e um link para a rota de detalhe; a navegacao fica a cargo do
 * Expo Router, sem que a tela de origem precise saber para onde ir.
 */
export function Cartaz({
  anime,
  largura = LarguraCartaz.carrossel,
  mostrarLegenda = true,
  mostrarNota = true,
  progresso,
}: Props) {
  return (
    // A largura fica numa View externa: com Link asChild, o estilo em forma de
    // funcao do Pressable nao chega ao elemento na versao web, e o cartaz
    // passava a ter a largura do proprio titulo.
    <View style={{ width: largura }}>
      <Link href={{ pathname: '/anime/[id]', params: { id: anime.id } }} asChild>
        <Pressable style={({ pressed }) => pressed && styles.pressionado}>
          <View
            style={[
              styles.moldura,
              { height: largura * 1.45 },
              anime.cor ? { backgroundColor: anime.cor } : null,
            ]}>
            <Image source={anime.capa} style={styles.imagem} contentFit="cover" transition={200} />
            {anime.dublado ? (
              <View style={styles.etiquetaDublado}>
                <Text style={styles.textoDublado}>DUB</Text>
              </View>
            ) : null}

            {progresso !== undefined && progresso > 0 ? (
              <View style={styles.progresso}>
                <BarraProgresso progresso={progresso} />
              </View>
            ) : null}
          </View>

          {mostrarLegenda ? (
            <View style={styles.legenda}>
              {/* A altura minima reserva sempre duas linhas: sem isso, cartazes
                de titulo curto ficam mais baixos e a base da grade serrilha. */}
              <Text style={styles.titulo} numberOfLines={2}>
                {anime.titulo}
              </Text>
              {mostrarNota && anime.nota !== null ? (
                <View style={styles.linhaNota}>
                  <Ionicons name="star" size={11} color={Cores.dourado} />
                  <Text style={styles.nota}>{anime.nota.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Pressable>
      </Link>
    </View>
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
  progresso: { position: 'absolute', bottom: 0, left: 0, right: 0 },
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
    minHeight: 34,
  },
  linhaNota: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  nota: {
    color: Cores.textoSecundario,
    fontSize: Fonte.minuscula,
    fontWeight: '600',
  },
});
