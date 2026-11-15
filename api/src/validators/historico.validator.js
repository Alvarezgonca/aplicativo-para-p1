'use strict';

const Joi = require('joi');

const { animeId, imagem, momento } = require('./comum');

const parametros = Joi.object({
  animeId,
  episodio: Joi.number().integer().min(1).max(100_000).required().label('episodio'),
});

/** Ponto onde o usuario parou um episodio. */
const registro = Joi.object({
  titulo: Joi.string().trim().min(1).max(300).required().label('titulo'),
  capa: imagem.required().label('capa'),
  banner: imagem.allow(null).default(null).label('banner'),
  tituloEpisodio: Joi.string().trim().max(300).allow('').required().label('tituloEpisodio'),
  miniatura: imagem.allow(null).default(null).label('miniatura'),
  duracao: Joi.number().integer().min(1).max(600).required().label('duracao'),
  progresso: Joi.number().min(0).max(1).required().label('progresso'),
  assistidoEm: momento.label('assistidoEm'),
});

module.exports = { parametros, registro };
