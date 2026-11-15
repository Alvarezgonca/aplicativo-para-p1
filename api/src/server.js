'use strict';

const { criarApp } = require('./app');
const { config } = require('./config/ambiente');
const { sequelize } = require('./database/conexao');
const { criarMigrador } = require('./database/migrador');
const { garantirContaDemonstracao } = require('./database/semear');

/**
 * Sobe a API em ordem: confere o banco, aplica as migracoes pendentes,
 * garante a conta de demonstracao e so entao abre a porta. Se o banco nao
 * responder, o processo sai com erro e o Docker tenta de novo, em vez de
 * aceitar requisicoes que falhariam.
 */
async function iniciar() {
  await sequelize.authenticate();
  const aplicadas = await criarMigrador(sequelize).up();
  if (aplicadas.length) {
    console.log(`Migracoes aplicadas: ${aplicadas.map((m) => m.name).join(', ')}`);
  }
  await garantirContaDemonstracao();

  const app = criarApp(config);
  const servidor = app.listen(config.porta, () => {
    console.log(`API ouvindo na porta ${config.porta} (${config.ambiente})`);
  });

  /**
   * Desligamento gracioso: ao receber o sinal de parada (deploy novo ou
   * docker stop), para de aceitar conexoes, termina as que estao em curso e
   * fecha o pool do banco antes de sair.
   */
  function desligar(sinal) {
    console.log(`${sinal} recebido, encerrando`);
    servidor.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
    // Se alguma conexao travar, sai mesmo assim depois de 10 segundos.
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('SIGTERM', () => desligar('SIGTERM'));
  process.on('SIGINT', () => desligar('SIGINT'));
}

iniciar().catch((erro) => {
  console.error('Falha ao iniciar a API:', erro.message);
  process.exit(1);
});
