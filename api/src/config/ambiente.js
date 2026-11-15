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

  banco: {
    host: ler('DB_HOST', 'localhost'),
    porta: lerInteiro('DB_PORT', 5432),
    nome: ler('DB_NAME', 'animes'),
    usuario: ler('DB_USER', 'animes'),
    // Sem valor padrao: a senha do banco precisa ser informada sempre.
    senha: ler('DB_PASSWORD'),
  },

  autenticacao: {
    // Chave que assina os tokens de acesso. Quem tiver esta chave consegue
    // criar tokens validos, entao ela vem de segredo e nunca do codigo.
    segredoJwt: ler('JWT_SECRET'),
    validadeAcesso: ler('JWT_VALIDADE', '15m'),
    diasRenovacao: lerInteiro('SESSAO_DIAS', 30),
    // Custo do bcrypt: cada +1 dobra o tempo para testar uma senha.
    custoBcrypt: lerInteiro('BCRYPT_CUSTO', 12),
  },

  /** Maximo de requisicoes por IP em cada janela (ver middlewares/limites.js). */
  limites: {
    geral: lerInteiro('LIMITE_GERAL', 900),
    login: lerInteiro('LIMITE_LOGIN', 10),
    cadastro: lerInteiro('LIMITE_CADASTRO', 10),
  },

  /**
   * Conta de demonstracao, para o professor e quem baixar o projeto
   * entrarem sem cadastro. E publica de proposito (o botao do aplicativo
   * preenche estes dados) e por isso nao pode ser excluida pela API.
   */
  demonstracao: {
    nome: 'Conta de demonstração',
    email: ler('DEMO_EMAIL', 'demo@exemplo.com'),
    senha: ler('DEMO_SENHA', 'demo1234'),
  },
};

if (config.autenticacao.segredoJwt.length < 32) {
  throw new Error('JWT_SECRET precisa ter pelo menos 32 caracteres.');
}

module.exports = { config, ler, lerInteiro };
