'use strict';

const Joi = require('joi');

/** Id de anime do AniList, que vem na URL. */
const animeId = Joi.number().integer().min(1).max(1_000_000_000).required().label('animeId');

/** Endereco de imagem: so https, para o aplicativo nunca carregar nada sem criptografia. */
const imagem = Joi.string()
  .uri({ scheme: ['https'] })
  .max(600);

/** Momento em milissegundos, como o Date.now() do aplicativo. */
const momento = Joi.number().integer().min(0).max(8_640_000_000_000);

module.exports = { animeId, imagem, momento };
