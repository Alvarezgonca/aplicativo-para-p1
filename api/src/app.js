'use strict';

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const { naoEncontrado, tratarErros } = require('./middlewares/erros');
const { registrarRequisicoes } = require('./middlewares/registro');
const rotasSaude = require('./routes/saude.routes');

/**
 * Monta a aplicacao Express sem abrir a porta.
 *
 * Separar a montagem (app.js) da subida do servidor (server.js) permite que
 * os testes chamem as rotas direto, sem rede, e que a ordem dos middlewares
 * fique toda num lugar so.
 */
function criarApp(config) {
  const app = express();

  app.set('trust proxy', config.proxiesConfiaveis);

  // Cabecalhos de seguranca (nosniff, HSTS, bloqueio de iframe e outros) e
  // remocao do X-Powered-By, que contaria que o servidor e Express.
  app.use(helmet());
  app.use(cors({ origin: config.origensPermitidas }));

  // Corpo limitado: nenhuma rota recebe mais que alguns quilobytes, e um
  // limite baixo corta pedidos gigantes feitos para travar o servidor.
  app.use(express.json({ limit: '50kb' }));

  if (!config.teste) {
    app.use(registrarRequisicoes);
  }

  app.use('/saude', rotasSaude);

  app.use(naoEncontrado);
  app.use(tratarErros);

  return app;
}

module.exports = { criarApp };
