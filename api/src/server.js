'use strict';

const { criarApp } = require('./app');
const { config } = require('./config/ambiente');

const app = criarApp(config);

const servidor = app.listen(config.porta, () => {
  console.log(`API ouvindo na porta ${config.porta} (${config.ambiente})`);
});

/**
 * Desligamento gracioso: ao receber o sinal de parada (deploy novo ou
 * docker stop), para de aceitar conexoes e termina as que estao em curso
 * antes de sair.
 */
function desligar(sinal) {
  console.log(`${sinal} recebido, encerrando`);
  servidor.close(() => process.exit(0));
  // Se alguma conexao travar, sai mesmo assim depois de 10 segundos.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => desligar('SIGTERM'));
process.on('SIGINT', () => desligar('SIGINT'));
