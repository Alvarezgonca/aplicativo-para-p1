import { chamarApi } from '@/services/api-app';
import type { Usuario } from '@/services/autenticacao';

/** Dados da conta logada, lidos do servidor (GET /usuarios/eu). */
export function buscarConta(): Promise<Usuario> {
  return chamarApi<Usuario>('/usuarios/eu');
}

/**
 * Exclui a conta no servidor (DELETE /usuarios/eu). A API pede a senha de
 * novo e apaga junto as sessoes, a lista e o historico.
 */
export function excluirConta(senha: string): Promise<void> {
  return chamarApi<void>('/usuarios/eu', {
    method: 'DELETE',
    body: JSON.stringify({ senha }),
  });
}
