import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';

interface Props {
  titulo: string;
  subtitulo?: string;
  /** Elemento opcional alinhado a direita, como um botao de acao. */
  direita?: ReactNode;
}

/**
 * Cabecalho das telas empilhadas sobre as abas (ranking, genero, historico,
 * configuracoes e outras).
 *
 * A pilha raiz esconde o cabecalho nativo para que cada tela controle o
 * proprio visual; este componente devolve o botao de voltar, o titulo e o
 * recuo da area segura em um formato unico para todas elas.
 *
 * Quando a tela foi aberta direto por um link, nao ha nada embaixo dela na
 * pilha. Nesse caso o botao de voltar troca a tela pela inicial.
 */
export function CabecalhoTela({ titulo, subtitulo, direita }: Props) {
  const router = useRouter();
  const recuo = useSafeAreaInsets();

  function voltar() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <View style={[styles.cabecalho, { paddingTop: recuo.top + Espacamento.sm }]}>
      <Pressable
        style={({ pressed }) => [styles.voltar, pressed && styles.pressionado]}
        onPress={voltar}
        hitSlop={10}
        accessibilityLabel="Voltar">
        <Ionicons name="arrow-back" size={22} color={Cores.texto} />
      </Pressable>

      <View style={styles.textos}>
        <Text style={styles.titulo} numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={styles.subtitulo} numberOfLines={1}>
            {subtitulo}
          </Text>
        ) : null}
      </View>

      {direita ? <View style={styles.direita}>{direita}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    paddingBottom: Espacamento.md,
    backgroundColor: Cores.fundo,
    borderBottomWidth: 1,
    borderBottomColor: Cores.divisoria,
  },
  voltar: {
    width: 36,
    height: 36,
    borderRadius: Raio.pilula,
    backgroundColor: Cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: { opacity: 0.6 },
  textos: { flex: 1 },
  titulo: { color: Cores.texto, fontSize: Fonte.titulo, fontWeight: '800' },
  subtitulo: { color: Cores.textoTerciario, fontSize: Fonte.minuscula, marginTop: 2 },
  direita: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.md },
});
