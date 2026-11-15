'use strict';

const Joi = require('joi');

const { animeId, imagem, momento } = require('./comum');

const parametros = Joi.object({ animeId });

/** Dados do cartaz que o aplicativo manda ao salvar um anime. */
const item = Joi.object({
  titulo: Joi.string().trim().min(1).max(300).required().label('titulo'),
  tituloRomaji: Joi.string().trim().max(300).allow('').required().label('tituloRomaji'),
  tituloNativo: Joi.string().trim().max(300).allow(null, '').default(null).label('tituloNativo'),
  capa: imagem.required().label('capa'),
  capaGrande: imagem.required().label('capaGrande'),
  capaPequena: imagem.required().label('capaPequena'),
  banner: imagem.allow(null).default(null).label('banner'),
  cor: Joi.string()
    .pattern(/^#[0-9a-fA-F]{6}$/)
    .allow(null)
    .default(null)
    .label('cor'),
  nota: Joi.number().min(0).max(10).allow(null).default(null).label('nota'),
  generos: Joi.array().items(Joi.string().max(40)).max(30).default([]).label('generos'),
  ano: Joi.number().integer().min(1900).max(2100).allow(null).default(null).label('ano'),
  totalEpisodios: Joi.number()
    .integer()
    .min(0)
    .max(100_000)
    .allow(null)
    .default(null)
    .label('totalEpisodios'),
  formato: Joi.string().max(20).allow(null).default(null).label('formato'),
  salvoEm: momento.label('salvoEm'),
});

module.exports = { parametros, item };
