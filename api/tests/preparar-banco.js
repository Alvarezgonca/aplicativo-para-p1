'use strict';

/**
 * Preparacao global (roda uma vez, antes de todos os testes): cria o banco
 * de testes se ele nao existir, zera o esquema e aplica as migracoes. Assim
 * os testes tambem provam que as migracoes funcionam num banco vazio.
 */
module.exports = async function prepararBanco() {
  require('./ambiente');
  const { Client } = require('pg');

  const conexao = {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'animes',
    password: process.env.DB_PASSWORD,
  };

  const admin = new Client({ ...conexao, database: 'postgres' });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    process.env.DB_NAME,
  ]);
  if (rowCount === 0) {
    // Nome de banco nao aceita parametro ($1); o valor vem da configuracao
    // dos testes e passa pela validacao abaixo antes de entrar no comando.
    if (!/^[a-z_]+$/.test(process.env.DB_NAME)) {
      throw new Error('Nome do banco de testes invalido.');
    }
    await admin.query(`CREATE DATABASE ${process.env.DB_NAME}`);
  }
  await admin.end();

  const banco = new Client({ ...conexao, database: process.env.DB_NAME });
  await banco.connect();
  await banco.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await banco.end();

  const { sequelize } = require('../src/database/conexao');
  const { criarMigrador } = require('../src/database/migrador');
  await criarMigrador(sequelize).up();
  await sequelize.close();
};
