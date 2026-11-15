'use strict';

const { rateLimit } = require('express-rate-limit');

const MINUTO = 60 * 1000;

function responderLimite(mensagem) {
  return (req, res) => {
    res.status(429).json({ erro: mensagem });
  };
}

/**
 * Limite geral por IP, para todas as rotas. Folgado para o uso normal do
 * aplicativo (o player grava o progresso a cada poucos segundos), mas corta
 * scripts que disparam milhares de requisicoes.
 */
const limiteGeral = rateLimit({
  windowMs: 15 * MINUTO,
  limit: 900,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: responderLimite('Muitas requisições seguidas. Aguarde alguns minutos.'),
});

/**
 * Login: so as tentativas que falham contam. Sem isso, um robo poderia
 * testar milhares de senhas por minuto contra um e-mail. Com 10 erros a
 * cada 15 minutos, adivinhar uma senha razoavel leva seculos.
 */
const limiteLogin = rateLimit({
  windowMs: 15 * MINUTO,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: responderLimite('Muitas tentativas de login. Aguarde 15 minutos e tente de novo.'),
});

/** Cadastro: evita a criacao de contas em massa a partir de um mesmo IP. */
const limiteCadastro = rateLimit({
  windowMs: 60 * MINUTO,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: responderLimite('Muitos cadastros a partir desta rede. Tente de novo mais tarde.'),
});

module.exports = { limiteGeral, limiteLogin, limiteCadastro };
