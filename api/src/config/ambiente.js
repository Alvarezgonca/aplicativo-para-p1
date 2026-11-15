'use strict';

const fs = require('node:fs');

/**
 * Le uma configuracao do ambiente.
 *
 * Segredos podem vir de arquivo: quando existe NOME_FILE, o valor e lido do
 * arquivo indicado. E o padrao dos segredos do Docker, montados em
 * /run/secrets, e evita que a senha apareca na lista de variaveis do
 * conteiner ou no historico do terminal.
 */
function ler(nome, padrao) {
  const arquivo = process.env[`${nome}_FILE`];
  if (arquivo) {
    return fs.readFileSync(arquivo, 'utf8').trim();
  }
  const valor = process.env[nome];
  if (valor !== undefined && valor !== '') {
    return valor;
  }
  if (padrao !== undefined) {
    return padrao;
  }
  // Falhar na subida e melhor do que rodar com configuracao pela metade.
  throw new Error(`Variavel de ambiente obrigatoria ausente: ${nome}`);
}

function lerInteiro(nome, padrao) {
  const valor = Number.parseInt(ler(nome, String(padrao)), 10);
  if (Number.isNaN(valor)) {
    throw new Error(`A variavel ${nome} precisa ser um numero inteiro.`);
  }
  return valor;
}

const ambiente = ler('NODE_ENV', 'development');

const config = {
  ambiente,
  producao: ambiente === 'production',
  teste: ambiente === 'test',
  porta: lerInteiro('PORT', 3000),

  /**
   * Quantos proxies existem na frente da API. Em producao ha um (o Traefik),
   * e o Express precisa saber disso para ler o IP real do cliente no
   * X-Forwarded-For; sem proxy, confiar nesse cabecalho deixaria qualquer um
   * inventar o proprio IP e escapar do limite de requisicoes.
   */
  proxiesConfiaveis: lerInteiro('PROXIES_CONFIAVEIS', 0),

  /**
   * Origens que podem chamar a API pelo navegador (a versao web do
   * aplicativo). O aplicativo no celular nao envia Origin e nao passa pelo
   * CORS.
   */
  origensPermitidas: ler('CORS_ORIGENS', 'http://localhost:8081')
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean),
};

module.exports = { config, ler, lerInteiro };
