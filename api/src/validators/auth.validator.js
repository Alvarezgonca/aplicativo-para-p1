'use strict';

const Joi = require('joi');

/**
 * O bcrypt so considera os primeiros 72 bytes da senha. Uma senha maior
 * seria cortada sem aviso, entao o limite e checado em bytes (acento e
 * emoji ocupam mais de um).
 */
const senhaNova = Joi.string()
  .min(8)
  .custom((valor, ajudantes) =>
    Buffer.byteLength(valor, 'utf8') > 72 ? ajudantes.error('string.max', { limit: 72 }) : valor,
  )
  .pattern(/\p{L}/u, { name: 'precisa ter pelo menos uma letra' })
  .pattern(/\d/, { name: 'precisa ter pelo menos um número' })
  .required()
  .label('senha');

const email = Joi.string()
  .trim()
  .lowercase()
  .max(254)
  .email({ tlds: { allow: false } })
  .required()
  .label('e-mail');

/** Token de renovacao: 32 bytes aleatorios em base64url (43 caracteres). */
const tokenRenovacao = Joi.string()
  .length(43)
  .pattern(/^[A-Za-z0-9_-]+$/)
  .required()
  .label('token de renovação');

const cadastro = Joi.object({
  nome: Joi.string().trim().min(2).max(80).required().label('nome'),
  email,
  senha: senhaNova,
});

const entrar = Joi.object({
  email,
  // No login a regra de formato nao e aplicada: so o tamanho maximo.
  senha: Joi.string().max(200).required().label('senha'),
});

const renovar = Joi.object({ tokenRenovacao });

module.exports = { cadastro, entrar, renovar };
