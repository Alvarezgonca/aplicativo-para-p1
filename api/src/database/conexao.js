'use strict';

const { Sequelize } = require('sequelize');

const { config } = require('../config/ambiente');

/**
 * Conexao unica com o PostgreSQL, compartilhada por todos os modelos.
 *
 * O Sequelize mantem um pool de conexoes abertas e entrega uma a cada
 * consulta, em vez de abrir e fechar uma conexao por requisicao. Os valores
 * das consultas sempre vao como parametros, nunca colados no texto do SQL,
 * o que fecha a porta para injecao de SQL.
 */
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: config.banco.host,
  port: config.banco.porta,
  database: config.banco.nome,
  username: config.banco.usuario,
  password: config.banco.senha,
  logging: false,
  pool: { max: 10, min: 0, idle: 10_000 },
  define: {
    // Colunas em snake_case no banco (criado_em) e camelCase no codigo (criadoEm).
    underscored: true,
    createdAt: 'criadoEm',
    updatedAt: 'atualizadoEm',
  },
});

module.exports = { sequelize };
