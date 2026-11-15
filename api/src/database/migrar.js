'use strict';

/**
 * Linha de comando das migracoes.
 *
 *   npm run migrar           aplica as pendentes
 *   npm run migrar -- down   desfaz a ultima
 */
const { sequelize } = require('./conexao');
const { criarMigrador } = require('./migrador');

async function principal() {
  const migrador = criarMigrador(sequelize);
  const acao = process.argv[2] ?? 'up';
  const feitas = acao === 'down' ? await migrador.down() : await migrador.up();
  const nomes = feitas.map((migracao) => migracao.name);
  console.log(nomes.length ? `${acao}: ${nomes.join(', ')}` : 'Nada a fazer.');
}

principal()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
