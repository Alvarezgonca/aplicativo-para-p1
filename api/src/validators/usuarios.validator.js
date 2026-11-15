'use strict';

const Joi = require('joi');

/** Excluir a conta pede a senha de novo, mesmo com o token valido. */
const excluirConta = Joi.object({
  senha: Joi.string().max(200).required().label('senha'),
});

module.exports = { excluirConta };
