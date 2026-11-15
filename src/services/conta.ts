import { chamarApi } from '@/services/api-app';
import type { Usuario } from '@/services/autenticacao';

/** Dados da conta logada, lidos do servidor (GET /usuarios/eu). */
export function buscarConta(): Promise<Usuario> {
  return chamarApi<Usuario>('/usuarios/eu');
}
