'use strict';

const { Router } = require('express');

const controller = require('../controllers/historico.controller');
const { autenticar } = require('../middlewares/autenticar');
const { validar } = require('../middlewares/validar');
const esquemas = require('../validators/historico.validator');

const rotas = Router();

rotas.use(autenticar);

rotas.get('/', controller.listar);
rotas.put(
  '/:animeId/:episodio',
  validar({ params: esquemas.parametros, body: esquemas.registro }),
  controller.registrar,
);
rotas.delete('/', controller.limpar);

module.exports = rotas;
