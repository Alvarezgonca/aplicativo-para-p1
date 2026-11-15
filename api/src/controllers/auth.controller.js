'use strict';

const authService = require('../services/auth.service');

/**
 * Nome do aparelho que abriu a sessao (o User-Agent, cortado). Serve so
 * para identificar a sessao; nao e usado em nenhuma decisao de seguranca.
 */
function dispositivoDe(req) {
  return (req.get('user-agent') ?? '').slice(0, 120) || null;
}

async function cadastrar(req, res) {
  const resultado = await authService.cadastrar(req.dados, dispositivoDe(req));
  res.status(201).json(resultado);
}

async function entrar(req, res) {
  const resultado = await authService.entrar(req.dados, dispositivoDe(req));
  res.json(resultado);
}

async function renovar(req, res) {
  res.json(await authService.renovar(req.dados.tokenRenovacao));
}

async function sair(req, res) {
  await authService.sair(req.dados.tokenRenovacao);
  res.status(204).end();
}

module.exports = { cadastrar, entrar, renovar, sair };
