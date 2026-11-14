import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { AvisoOffline } from '@/componentes/aviso-offline';
import { Cores } from '@/constants/tema';
import { ProvedorHistorico } from '@/contextos/historico';
import { ProvedorMinhaLista } from '@/contextos/minha-lista';
import { ProvedorSessao, useSessao } from '@/contextos/sessao';

// Mantem a tela de abertura nativa visivel ate a sessao salva ser lida.
SplashScreen.preventAutoHideAsync();

/**
 * Navegacao do aplicativo. So e montada depois que a sessao foi lida: antes
 * disso a tela de abertura continua por cima e nada e desenhado.
 */
function Navegacao() {
  const { pronto } = useSessao();

  useEffect(() => {
    if (pronto) {
      SplashScreen.hideAsync();
    }
  }, [pronto]);

  if (!pronto) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Cores.fundo },
        }}>
        <Stack.Screen name="(abas)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="player/[animeId]" options={{ animation: 'fade' }} />
      </Stack>
      <AvisoOffline />
    </>
  );
}

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
 *
 * Os provedores de contexto ficam aqui para valerem em todas as telas. A
 * sessao e o mais externo porque os demais dependem de quem esta logado.
 */
export default function LayoutRaiz() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ProvedorSessao>
        <ProvedorMinhaLista>
          <ProvedorHistorico>
            <Navegacao />
          </ProvedorHistorico>
        </ProvedorMinhaLista>
      </ProvedorSessao>
    </SafeAreaProvider>
  );
}
