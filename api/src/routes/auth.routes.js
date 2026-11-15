'use strict';

const { Router } = require('express');

const controller = require('../controllers/auth.controller');
const { validar } = require('../middlewares/validar');
const esquemas = require('../validators/auth.validator');

const rotas = Router();

rotas.post('/cadastro', validar({ body: esquemas.cadastro }), controller.cadastrar);
rotas.post('/entrar', validar({ body: esquemas.entrar }), controller.entrar);
rotas.post('/renovar', validar({ body: esquemas.renovar }), controller.renovar);
rotas.post('/sair', validar({ body: esquemas.renovar }), controller.sair);

module.exports = rotas;
