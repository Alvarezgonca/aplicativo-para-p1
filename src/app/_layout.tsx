import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { Cores } from '@/constants/tema';
import { ProvedorMinhaLista } from '@/contextos/minha-lista';

/**
 * Layout raiz da aplicacao.
 *
 * Declara uma pilha de navegacao com o grupo de abas na base. As telas de
 * detalhe e de reproducao ficam fora do grupo e sao empilhadas por cima da
 * barra de abas, como acontece no aplicativo original.
 *
 * O provedor de area segura recebe initialWindowMetrics. Sem esse valor ele
 * inicia com as margens indefinidas e nao renderiza os filhos ate o sistema
 * responder qual e a area util da tela, o que adia a primeira renderizacao do
 * aplicativo inteiro. As metricas iniciais vem das constantes nativas de forma
 * sincrona, entao a arvore e montada ja na primeira passagem.
 */
export default function LayoutRaiz() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ProvedorMinhaLista>
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
      </ProvedorMinhaLista>
    </SafeAreaProvider>
  );
}
