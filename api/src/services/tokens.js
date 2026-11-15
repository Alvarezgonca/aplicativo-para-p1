'use strict';

const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const { config } = require('../config/ambiente');

const EMISSOR = 'animes-api';
const PUBLICO = 'animes-app';

/**
 * Dois tokens, com papeis diferentes:
 *
 * - Token de acesso (JWT): vai no cabecalho Authorization de cada
 *   requisicao. E assinado, entao a API confere sem ir ao banco, e vale
 *   pouco tempo (15 minutos). Se vazar, o estrago dura minutos.
 *
 * - Token de renovacao: texto aleatorio de 32 bytes, guardado no cofre do
 *   celular. Serve so para pedir um novo token de acesso. No banco fica
 *   apenas o hash SHA-256 dele, e a cada uso ele e trocado por outro
 *   (rotacao). Sair da conta apaga a sessao e ele deixa de valer na hora.
 */
function gerarTokenAcesso(usuario) {
  // O token so carrega o id do usuario (sub). Nada pessoal vai nele, porque
  // o conteudo de um JWT e legivel por qualquer um; so a assinatura e secreta.
  return jwt.sign({}, config.autenticacao.segredoJwt, {
    subject: usuario.id,
    expiresIn: config.autenticacao.validadeAcesso,
    issuer: EMISSOR,
    audience: PUBLICO,
    algorithm: 'HS256',
  });
}

/**
 * Confere assinatura, validade, emissor e publico. O algoritmo e fixado em
 * HS256: sem isso, um token forjado com "alg: none" poderia ser aceito.
 */
function verificarTokenAcesso(token) {
  return jwt.verify(token, config.autenticacao.segredoJwt, {
    algorithms: ['HS256'],
    issuer: EMISSOR,
    audience: PUBLICO,
  });
}

function gerarTokenRenovacao() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * SHA-256 basta aqui (e nao bcrypt) porque o token ja e aleatorio e longo:
 * nao ha como adivinhar por tentativa, ao contrario de uma senha.
 */
function hashDoToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { gerarTokenAcesso, verificarTokenAcesso, gerarTokenRenovacao, hashDoToken };
