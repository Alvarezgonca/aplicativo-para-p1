import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { AvisoOffline } from '@/componentes/aviso-offline';
import { Cores } from '@/constants/tema';
import { ProvedorHistorico } from '@/contextos/historico';
import { ProvedorMinhaLista } from '@/contextos/minha-lista';
import { ProvedorPreferencias } from '@/contextos/preferencias';
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
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      </Stack>
      <AvisoOffline />
    </>
  );
}

/**
 * Layout raiz da aplicacao.
 *
 * A pilha raiz tem dois grupos: (auth), com apresentacao e login, e (app),
 * com tudo o que exige sessao. Cada grupo decide no proprio layout se o
 * usuario pode estar ali e redireciona quando nao pode.
 *
 * O provedor de area segura recebe initialWindowMetrics. Sem esse valor ele
 * inicia com as margens indefinidas e nao renderiza os filhos ate o sistema
 * responder qual e a area util da tela, o que adia a primeira renderizacao do
 * aplicativo inteiro. As metricas iniciais vem das constantes nativas de forma
 * sincrona, entao a arvore e montada ja na primeira passagem.
 *
 * Os provedores de contexto ficam aqui para valerem em todas as telas. As
 * preferencias sao do aparelho e valem ate no login; a sessao vem logo
 * depois porque a lista e o historico dependem de quem esta logado.
 */
export default function LayoutRaiz() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ProvedorPreferencias>
        <ProvedorSessao>
          <ProvedorMinhaLista>
            <ProvedorHistorico>
              <Navegacao />
            </ProvedorHistorico>
          </ProvedorMinhaLista>
        </ProvedorSessao>
      </ProvedorPreferencias>
    </SafeAreaProvider>
  );
}
