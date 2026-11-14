import { Stack } from 'expo-router';

import { Cores } from '@/constants/tema';

/**
 * Grupo das telas de entrada (boas-vindas e login).
 *
 * Os parenteses no nome da pasta fazem dela um grupo: organiza as rotas e
 * permite um layout proprio sem entrar na URL. A tela de login continua
 * sendo /entrar, e nao /(auth)/entrar.
 */
export default function LayoutEntrada() {
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
