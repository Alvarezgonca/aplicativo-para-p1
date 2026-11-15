'use strict';

const bcrypt = require('bcryptjs');

const { config } = require('../config/ambiente');
const { Usuario } = require('../models');

/**
 * Garante que a conta de demonstracao exista. Roda a cada subida da API e
 * nao faz nada se ela ja estiver no banco, entao pode rodar quantas vezes
 * for preciso (e idempotente).
 */
async function garantirContaDemonstracao() {
  const { nome, email, senha } = config.demonstracao;
  const existente = await Usuario.findOne({ where: { email } });
  if (existente) {
    if (!existente.demo) {
      await existente.update({ demo: true });
    }
    return;
  }
  const senhaHash = await bcrypt.hash(senha, config.autenticacao.custoBcrypt);
  await Usuario.create({ nome, email, senhaHash, demo: true });
  console.log(`Conta de demonstracao criada: ${email}`);
}

module.exports = { garantirContaDemonstracao };
