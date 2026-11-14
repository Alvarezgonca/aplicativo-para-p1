import { Redirect, Stack } from 'expo-router';

import { Cores } from '@/constants/tema';
import { useSessao } from '@/contextos/sessao';

/**
 * Grupo das telas de entrada (boas-vindas e login).
 *
 * Os parenteses no nome da pasta fazem dela um grupo: organiza as rotas e
 * permite um layout proprio sem entrar na URL. A tela de login continua
 * sendo /entrar, e nao /(auth)/entrar.
 *
 * E o caminho inverso do grupo (app): quem ja esta logado e mandado para a
 * inicio, entao abrir /entrar com sessao ativa nao mostra o login de novo.
 */
export default function LayoutEntrada() {
  const { usuario } = useSessao();

  if (usuario) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Cores.fundo },
        animation: 'fade',
      }}
    />
  );
}
