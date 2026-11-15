'use strict';

const { Router } = require('express');

const { sequelize } = require('../database/conexao');

const rotas = Router();

/**
 * Verificacao de saude, usada pelo Docker e pelo monitoramento para saber
 * se a API esta de pe e consegue falar com o banco. Nao exige login e nao
 * revela versao, ambiente nem o motivo da falha.
 */
rotas.get('/', async (req, res) => {
  try {
    await sequelize.query('SELECT 1');
    res.json({ status: 'ok', banco: 'ok' });
  } catch {
    res.status(503).json({ status: 'indisponivel', banco: 'falhou' });
  }
});

module.exports = rotas;
