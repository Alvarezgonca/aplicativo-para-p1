import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Cores } from '@/constants/tema';

/**
 * Layout raiz da aplicacao.
 *
 * Declara uma pilha de navegacao com o grupo de abas na base. As telas de
 * detalhe e de reproducao ficam fora do grupo e sao empilhadas por cima da
 * barra de abas, como acontece no aplicativo original.
 */
export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Cores.fundo },
        }}>
        <Stack.Screen name="(abas)" />
        <Stack.Screen name="anime/[id]" />
        <Stack.Screen name="player/[episodioId]" options={{ animation: 'fade' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
