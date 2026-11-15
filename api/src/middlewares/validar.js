'use strict';

const { ErroHttp } = require('../utils/erro-http');

/** Mensagens do Joi em portugues, para o aplicativo mostrar direto ao usuario. */
const MENSAGENS = {
  'any.required': 'Preencha o campo {{#label}}.',
  'any.only': 'O campo {{#label}} tem um valor que não é aceito.',
  'string.base': 'O campo {{#label}} precisa ser um texto.',
  'string.empty': 'Preencha o campo {{#label}}.',
  'string.min': 'O campo {{#label}} precisa ter pelo menos {{#limit}} caracteres.',
  'string.max': 'O campo {{#label}} pode ter no máximo {{#limit}} caracteres.',
  'string.length': 'O campo {{#label}} precisa ter {{#limit}} caracteres.',
  'string.email': 'Informe um e-mail válido.',
  'string.uri': 'O campo {{#label}} precisa ser um endereço https válido.',
  'string.uriCustomScheme': 'O campo {{#label}} precisa ser um endereço https válido.',
  'string.pattern.name': 'O campo {{#label}} {{#name}}.',
  'string.pattern.base': 'O campo {{#label}} está em um formato inválido.',
  'number.base': 'O campo {{#label}} precisa ser um número.',
  'number.integer': 'O campo {{#label}} precisa ser um número inteiro.',
  'number.min': 'O campo {{#label}} precisa ser no mínimo {{#limit}}.',
  'number.max': 'O campo {{#label}} pode ser no máximo {{#limit}}.',
  'boolean.base': 'O campo {{#label}} precisa ser verdadeiro ou falso.',
  'array.base': 'O campo {{#label}} precisa ser uma lista.',
  'array.max': 'O campo {{#label}} pode ter no máximo {{#limit}} itens.',
  'object.base': 'O corpo precisa ser um objeto JSON.',
};

/**
 * Valida partes da requisicao com esquemas do Joi antes do controller.
 *
 * Recebe um objeto com esquemas para body e params. Campos desconhecidos sao
 * descartados (stripUnknown), entao o controller so ve o que o esquema
 * declarou, ja convertido e limpo (texto aparado, e-mail em minusculas). Os
 * valores validados ficam em req.dados e req.parametros.
 *
 * Erro de validacao responde 422 com a lista de campos e o motivo de cada um.
 */
function validar(esquemas) {
  return (req, res, next) => {
    const partes = [
      ['params', 'parametros'],
      ['body', 'dados'],
    ];
    for (const [origem, destino] of partes) {
      const esquema = esquemas[origem];
      if (!esquema) {
        continue;
      }
      const { value, error } = esquema.validate(req[origem] ?? {}, {
        abortEarly: false,
        stripUnknown: true,
        messages: MENSAGENS,
        errors: { wrap: { label: false } },
      });
      if (error) {
        throw new ErroHttp(
          422,
          error.details[0].message,
          error.details.map((detalhe) => ({
            campo: detalhe.path.join('.'),
            mensagem: detalhe.message,
          })),
        );
      }
      req[destino] = value;
    }
    next();
  };
}

module.exports = { validar };
