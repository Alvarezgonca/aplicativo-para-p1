'use strict';

const path = require('node:path');
const { SequelizeStorage, Umzug } = require('umzug');

/**
 * Migracoes do banco com o Umzug (a mesma biblioteca usada pelo
 * sequelize-cli).
 *
 * Cada arquivo da pasta migracoes descreve uma mudanca no esquema, com up
 * (aplicar) e down (desfazer), e roda uma vez so: a tabela migracoes guarda
 * o nome das que ja foram aplicadas. Assim o banco de qualquer maquina chega
 * ao mesmo esquema na mesma ordem, sem depender do sync() do Sequelize, que
 * em producao poderia apagar ou recriar tabelas com dados.
 */
function criarMigrador(sequelize) {
  return new Umzug({
    migrations: {
      glob: ['migracoes/*.js', { cwd: path.join(__dirname) }],
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize, tableName: 'migracoes' }),
    logger: undefined,
  });
}

module.exports = { criarMigrador };
