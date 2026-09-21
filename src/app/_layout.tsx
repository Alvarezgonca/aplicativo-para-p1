import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Layout raiz da aplicacao.
 *
 * O Expo Router monta a navegacao a partir da arvore de arquivos dentro de
 * src/app. Este arquivo e o ponto de entrada: tudo que for renderizado aqui
 * envolve todas as telas do aplicativo.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
