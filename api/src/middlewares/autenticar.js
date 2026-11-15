'use strict';

const { Usuario } = require('../models');
const { verificarTokenAcesso } = require('../services/tokens');
const { ErroHttp } = require('../utils/erro-http');

/**
 * Exige um token de acesso valido no cabecalho Authorization: Bearer <token>.
 *
 * Confere a assinatura e a validade do JWT e depois busca o dono no banco:
 * uma conta excluida nao continua usando a API ate o token vencer. O usuario
 * fica em req.usuario, e as rotas usam o id dele em todas as consultas.
 * Por isso um usuario nunca le nem altera os dados de outro: o id vem do
 * token assinado, nunca da URL ou do corpo da requisicao.
 */
async function autenticar(req, res, next) {
  const [tipo, token] = (req.get('authorization') ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    throw new ErroHttp(401, 'Faça login para continuar.');
  }

  let conteudo;
  try {
    conteudo = verificarTokenAcesso(token);
  } catch {
    throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.');
  }

  const usuario = await Usuario.findByPk(conteudo.sub);
  if (!usuario) {
    throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.');
  }

  req.usuario = usuario;
  next();
}

module.exports = { autenticar };
