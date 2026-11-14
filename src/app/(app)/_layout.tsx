import { Redirect, Stack } from 'expo-router';

import { Cores } from '@/constants/tema';
import { useSessao } from '@/contextos/sessao';

/**
 * Grupo das telas que exigem login.
 *
 * Todas as rotas dentro de (app) passam por este layout antes de aparecer.
 * Sem usuario na sessao, o Redirect manda para a apresentacao (primeiro uso)
 * ou direto para o login, e nenhuma tela protegida chega a ser desenhada.
 * Dentro do grupo fica a pilha principal: as abas na base e as telas de
 * detalhe, ranking, genero, personagem e player empilhadas por cima delas.
 */
export default function LayoutProtegido() {
  const { usuario, boasVindasVista } = useSessao();

  if (!usuario) {
    return <Redirect href={boasVindasVista ? '/entrar' : '/boas-vindas'} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Cores.fundo },
      }}>
      <Stack.Screen name="(abas)" />
      <Stack.Screen name="player/[animeId]" options={{ animation: 'fade' }} />
    </Stack>
  );
}
