'use strict';

/**
 * Ambiente dos testes. Roda antes de cada arquivo de teste.
 *
 * Os testes usam um banco proprio (animes_teste), apagado e recriado a cada
 * execucao, e nunca o banco de desenvolvimento. O endereco e a senha do
 * PostgreSQL vem do .env (o mesmo da API). O custo do bcrypt cai para 4 so
 * aqui, para os testes de login nao levarem segundos cada um.
 *
 * Cada arquivo de teste cria varias contas a partir do mesmo IP, entao o
 * limite de cadastros sobe aqui. O limite em si e testado em
 * limites.test.js, que volta a usar um valor baixo.
 */
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'animes_teste';
process.env.JWT_SECRET = 'segredo-usado-somente-nos-testes-automatizados';
process.env.BCRYPT_CUSTO = '4';
process.env.LIMITE_CADASTRO = '1000';
