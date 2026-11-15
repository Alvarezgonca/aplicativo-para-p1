'use strict';

const bcrypt = require('bcryptjs');
const { Op, UniqueConstraintError } = require('sequelize');

const { config } = require('../config/ambiente');
const { Sessao, Usuario } = require('../models');
const { ErroHttp } = require('../utils/erro-http');
const { gerarTokenAcesso, gerarTokenRenovacao, hashDoToken } = require('./tokens');

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Hash de uma senha que ninguem tem. Quando o e-mail nao existe, o login
 * compara a senha com ele mesmo assim: a resposta leva o mesmo tempo nos
 * dois casos e nao entrega quais e-mails tem conta.
 */
const HASH_FALSO = bcrypt.hashSync('senha-de-nenhuma-conta', config.autenticacao.custoBcrypt);

function validadeDaSessao() {
  return new Date(Date.now() + config.autenticacao.diasRenovacao * DIA_MS);
}

/** Cria a sessao no banco e devolve o usuario com o par de tokens. */
async function abrirSessao(usuario, dispositivo) {
  // Aproveita para limpar as sessoes vencidas deste usuario.
  await Sessao.destroy({ where: { usuarioId: usuario.id, expiraEm: { [Op.lt]: new Date() } } });

  const tokenRenovacao = gerarTokenRenovacao();
  await Sessao.create({
    usuarioId: usuario.id,
    tokenHash: hashDoToken(tokenRenovacao),
    dispositivo,
    expiraEm: validadeDaSessao(),
  });

  return {
    usuario: usuario.paraResposta(),
    tokenAcesso: gerarTokenAcesso(usuario),
    tokenRenovacao,
  };
}

async function cadastrar({ nome, email, senha }, dispositivo) {
  if (await Usuario.findOne({ where: { email } })) {
    throw new ErroHttp(409, 'Já existe uma conta com este e-mail.');
  }

  const senhaHash = await bcrypt.hash(senha, config.autenticacao.custoBcrypt);
  let usuario;
  try {
    usuario = await Usuario.create({ nome, email, senhaHash });
  } catch (erro) {
    // Dois cadastros com o mesmo e-mail ao mesmo tempo: o indice unico do
    // banco segura o segundo.
    if (erro instanceof UniqueConstraintError) {
      throw new ErroHttp(409, 'Já existe uma conta com este e-mail.');
    }
    throw erro;
  }
  return abrirSessao(usuario, dispositivo);
}

async function entrar({ email, senha }, dispositivo) {
  const usuario = await Usuario.findOne({ where: { email } });
  const confere = await bcrypt.compare(senha, usuario?.senhaHash ?? HASH_FALSO);
  if (!usuario || !confere) {
    // A mesma mensagem para e-mail inexistente e senha errada.
    throw new ErroHttp(401, 'E-mail ou senha incorretos.');
  }
  return abrirSessao(usuario, dispositivo);
}

/**
 * Troca o token de renovacao por um par novo.
 *
 * A troca e atomica: o UPDATE so acontece se o hash ainda for o antigo.
 * Se o mesmo token for usado duas vezes, a segunda tentativa nao acha a
 * sessao e recebe 401, entao um token copiado deixa de servir assim que o
 * dono legitimo o usar.
 */
async function renovar(tokenRenovacao) {
  const hashAntigo = hashDoToken(tokenRenovacao);
  const sessao = await Sessao.findOne({
    where: { tokenHash: hashAntigo },
    include: { model: Usuario, as: 'usuario' },
  });

  if (!sessao || sessao.expirada) {
    if (sessao) {
      await sessao.destroy();
    }
    throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.');
  }

  const novoToken = gerarTokenRenovacao();
  const [alteradas] = await Sessao.update(
    { tokenHash: hashDoToken(novoToken), expiraEm: validadeDaSessao() },
    { where: { id: sessao.id, tokenHash: hashAntigo } },
  );
  if (alteradas !== 1) {
    throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.');
  }

  return { tokenAcesso: gerarTokenAcesso(sessao.usuario), tokenRenovacao: novoToken };
}

/** Encerra a sessao do aparelho. Responde igual se ela ja nao existia. */
async function sair(tokenRenovacao) {
  await Sessao.destroy({ where: { tokenHash: hashDoToken(tokenRenovacao) } });
}

module.exports = { cadastrar, entrar, renovar, sair };
