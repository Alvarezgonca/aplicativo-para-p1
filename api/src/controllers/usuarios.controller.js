'use strict';

const bcrypt = require('bcryptjs');

const { ErroHttp } = require('../utils/erro-http');

/** Dados da conta do dono do token. */
async function verEu(req, res) {
  res.json(req.usuario.paraResposta());
}

/**
 * Exclui a conta e tudo o que pertence a ela (sessoes, lista e historico
 * caem junto, pelas chaves estrangeiras com ON DELETE CASCADE).
 *
 * Pede a senha antes: um celular desbloqueado nas maos de outra pessoa nao
 * basta para apagar a conta de alguem.
 */
async function excluirEu(req, res) {
  const usuario = req.usuario;
  if (usuario.demo) {
    throw new ErroHttp(403, 'A conta de demonstração não pode ser excluída.');
  }
  if (!(await bcrypt.compare(req.dados.senha, usuario.senhaHash))) {
    throw new ErroHttp(403, 'Senha incorreta.');
  }
  await usuario.destroy();
  res.status(204).end();
}

module.exports = { verEu, excluirEu };
