'use strict';

const { Router } = require('express');

const rotas = Router();

/**
 * Verificacao de saude, usada pelo Docker e pelo monitoramento para saber
 * se a API esta de pe. Nao exige login e nao revela versao nem ambiente.
 */
rotas.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = rotas;
