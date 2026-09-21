import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cores, Espacamento, Fonte } from '@/constants/tema';

interface Props {
  /** Quando verdadeiro, a barra fica sobreposta ao conteudo, sem fundo. */
  sobreposta?: boolean;
}

/**
 * Cabecalho fixo com a marca e os atalhos de notificacao e busca.
 *
 * O recuo superior vem de useSafeAreaInsets, que informa a altura ocupada pela
 * barra de status e pelo recorte da camera. Usar o valor do dispositivo evita
 * que o conteudo fique sob o entalhe em aparelhos diferentes.
 */
export function BarraSuperior({ sobreposta = false }: Props) {
  const recuo = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.barra,
        { paddingTop: recuo.top + Espacamento.sm },
        sobreposta ? styles.sobreposta : styles.solida,
      ]}>
      <Text style={styles.marca}>crunchyroll</Text>

      <View style={styles.acoes}>
        <Pressable hitSlop={8}>
          <Ionicons name="notifications-outline" size={22} color={Cores.texto} />
        </Pressable>
        <Pressable hitSlop={8} onPress={() => router.push('/busca')}>
          <Ionicons name="search" size={22} color={Cores.texto} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espacamento.lg,
    paddingBottom: Espacamento.md,
  },
  sobreposta: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  solida: { backgroundColor: Cores.fundo },
  marca: {
    color: Cores.marca,
    fontSize: Fonte.destaque,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  acoes: { flexDirection: 'row', gap: Espacamento.lg },
});
