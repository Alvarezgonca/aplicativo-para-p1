'use strict';

const { Router } = require('express');

const rotasAuth = require('./auth.routes');
const rotasUsuarios = require('./usuarios.routes');

/**
 * Rotas da versao 1 da API. O prefixo /v1 permite lancar uma versao nova
 * no futuro sem quebrar o aplicativo que ja esta instalado nos celulares.
 */
const v1 = Router();

v1.use('/auth', rotasAuth);
v1.use('/usuarios', rotasUsuarios);

module.exports = v1;
