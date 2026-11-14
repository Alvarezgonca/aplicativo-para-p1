import { Ionicons } from '@expo/vector-icons';
import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';

/**
 * Tela exibida quando o endereco aberto nao corresponde a nenhuma rota.
 *
 * O Expo Router usa este arquivo sempre que a navegacao chega a um caminho
 * inexistente, por exemplo por um link antigo ou digitado errado. Sem ela o
 * usuario veria a tela padrao da biblioteca, em ingles e sem saida.
 */
export default function TelaNaoEncontrada() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Text style={styles.codigo}>404</Text>
      <Ionicons name="compass-outline" size={56} color={Cores.marca} />
      <Text style={styles.titulo}>Página não encontrada</Text>
      <Text style={styles.texto}>
        O endereço que você abriu não existe ou foi removido do aplicativo.
      </Text>

      <Link href="/" replace asChild>
        <Pressable style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}>
          <Text style={styles.textoBotao}>Voltar ao início</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.xxl,
    backgroundColor: Cores.fundo,
  },
  codigo: {
    color: Cores.superficieAlta,
    fontSize: 72,
    fontWeight: '900',
  },
  titulo: { color: Cores.texto, fontSize: Fonte.destaque, fontWeight: '800' },
  texto: {
    color: Cores.textoSecundario,
    fontSize: Fonte.corpo,
    lineHeight: 22,
    textAlign: 'center',
  },
  botao: {
    backgroundColor: Cores.marca,
    paddingVertical: Espacamento.md,
    paddingHorizontal: Espacamento.xl,
    borderRadius: Raio.sm,
    marginTop: Espacamento.lg,
  },
  pressionado: { opacity: 0.7 },
  textoBotao: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '700' },
});
