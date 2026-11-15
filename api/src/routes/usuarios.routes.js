'use strict';

const { Router } = require('express');

const controller = require('../controllers/usuarios.controller');
const { autenticar } = require('../middlewares/autenticar');
const { validar } = require('../middlewares/validar');
const esquemas = require('../validators/usuarios.validator');

const rotas = Router();

rotas.use(autenticar);

rotas.get('/eu', controller.verEu);
rotas.delete('/eu', validar({ body: esquemas.excluirConta }), controller.excluirEu);

module.exports = rotas;
