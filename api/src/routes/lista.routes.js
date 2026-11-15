'use strict';

const { Router } = require('express');

const controller = require('../controllers/lista.controller');
const { autenticar } = require('../middlewares/autenticar');
const { validar } = require('../middlewares/validar');
const esquemas = require('../validators/lista.validator');

const rotas = Router();

rotas.use(autenticar);

rotas.get('/', controller.listar);
rotas.put(
  '/:animeId',
  validar({ params: esquemas.parametros, body: esquemas.item }),
  controller.salvar,
);
rotas.delete('/:animeId', validar({ params: esquemas.parametros }), controller.remover);

module.exports = rotas;
