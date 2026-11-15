'use strict';

/**
 * Documentacao da API no formato OpenAPI 3, exibida pelo Swagger UI em
 * /docs. Da para testar cada rota pelo navegador: entre, copie o
 * tokenAcesso e cole em "Authorize".
 */

const erro = {
  type: 'object',
  properties: {
    erro: { type: 'string', example: 'E-mail ou senha incorretos.' },
    detalhes: {
      type: 'array',
      items: {
        type: 'object',
        properties: { campo: { type: 'string' }, mensagem: { type: 'string' } },
      },
    },
  },
};

const respostaErro = (descricao) => ({
  description: descricao,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
});

const json = (schema) => ({ 'application/json': { schema } });
const ref = (nome) => ({ $ref: `#/components/schemas/${nome}` });

const usuario = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    nome: { type: 'string', example: 'Ana Souza' },
    email: { type: 'string', example: 'ana@exemplo.com' },
    criadoEm: { type: 'string', format: 'date-time' },
  },
};

const tokens = {
  type: 'object',
  properties: {
    tokenAcesso: {
      type: 'string',
      description: 'JWT de 15 minutos para o cabeçalho Authorization.',
    },
    tokenRenovacao: { type: 'string', description: 'Troca por um novo par em /auth/renovar.' },
  },
};

const itemLista = {
  type: 'object',
  required: ['titulo', 'tituloRomaji', 'capa', 'capaGrande', 'capaPequena'],
  properties: {
    animeId: { type: 'integer', readOnly: true, example: 154587 },
    titulo: { type: 'string', example: "Frieren: Beyond Journey's End" },
    tituloRomaji: { type: 'string', example: 'Sousou no Frieren' },
    tituloNativo: { type: 'string', nullable: true },
    capa: { type: 'string', format: 'uri' },
    capaGrande: { type: 'string', format: 'uri' },
    capaPequena: { type: 'string', format: 'uri' },
    banner: { type: 'string', format: 'uri', nullable: true },
    cor: { type: 'string', nullable: true, example: '#e4a15d' },
    nota: { type: 'number', nullable: true, example: 9.1 },
    generos: { type: 'array', items: { type: 'string' } },
    ano: { type: 'integer', nullable: true },
    totalEpisodios: { type: 'integer', nullable: true },
    formato: { type: 'string', nullable: true, example: 'TV' },
    salvoEm: { type: 'integer', description: 'Momento em milissegundos (na resposta, data ISO).' },
  },
};

const registroHistorico = {
  type: 'object',
  required: ['titulo', 'capa', 'tituloEpisodio', 'duracao', 'progresso'],
  properties: {
    animeId: { type: 'integer', readOnly: true },
    episodio: { type: 'integer', readOnly: true },
    titulo: { type: 'string' },
    capa: { type: 'string', format: 'uri' },
    banner: { type: 'string', format: 'uri', nullable: true },
    tituloEpisodio: { type: 'string' },
    miniatura: { type: 'string', format: 'uri', nullable: true },
    duracao: { type: 'integer', description: 'Minutos.', example: 24 },
    progresso: { type: 'number', minimum: 0, maximum: 1, example: 0.42 },
    assistidoEm: {
      type: 'integer',
      description: 'Momento em milissegundos (na resposta, data ISO).',
    },
  },
};

const comLogin = [{ bearer: [] }];
const paramAnime = { name: 'animeId', in: 'path', required: true, schema: { type: 'integer' } };
const semLogin = respostaErro('Sem token ou token vencido.');

const documento = {
  openapi: '3.0.3',
  info: {
    title: 'API do aplicativo de animes',
    version: '1.0.0',
    description:
      'Contas, minha lista e histórico de cada usuário. O catálogo de animes vem do AniList; esta API guarda o que é de cada pessoa.',
  },
  servers: [{ url: '/v1' }],
  components: {
    securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Erro: erro,
      Usuario: usuario,
      Tokens: tokens,
      ItemLista: itemLista,
      RegistroHistorico: registroHistorico,
    },
  },
  tags: [
    { name: 'Autenticação' },
    { name: 'Conta' },
    { name: 'Minha lista' },
    { name: 'Histórico' },
  ],
  paths: {
    '/auth/cadastro': {
      post: {
        tags: ['Autenticação'],
        summary: 'Cria uma conta e já abre a sessão',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['nome', 'email', 'senha'],
            properties: {
              nome: { type: 'string', example: 'Ana Souza' },
              email: { type: 'string', example: 'ana@exemplo.com' },
              senha: {
                type: 'string',
                example: 'segredo123',
                description: 'Mínimo de 8 caracteres, com letra e número.',
              },
            },
          }),
        },
        responses: {
          201: {
            description: 'Conta criada.',
            content: json({
              allOf: [tokens, { type: 'object', properties: { usuario: ref('Usuario') } }],
            }),
          },
          409: respostaErro('E-mail já cadastrado.'),
          422: respostaErro('Dados inválidos.'),
          429: respostaErro('Cadastros demais a partir do mesmo IP.'),
        },
      },
    },
    '/auth/entrar': {
      post: {
        tags: ['Autenticação'],
        summary: 'Entra com e-mail e senha',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['email', 'senha'],
            properties: {
              email: { type: 'string', example: 'demo@exemplo.com' },
              senha: { type: 'string', example: 'demo1234' },
            },
          }),
        },
        responses: {
          200: {
            description: 'Sessão aberta.',
            content: json({
              allOf: [tokens, { type: 'object', properties: { usuario: ref('Usuario') } }],
            }),
          },
          401: respostaErro('E-mail ou senha incorretos.'),
          429: respostaErro('Tentativas demais; aguarde 15 minutos.'),
        },
      },
    },
    '/auth/renovar': {
      post: {
        tags: ['Autenticação'],
        summary: 'Troca o token de renovação por um par novo',
        requestBody: {
          required: true,
          content: json({ type: 'object', properties: { tokenRenovacao: { type: 'string' } } }),
        },
        responses: {
          200: { description: 'Par novo.', content: json(tokens) },
          401: respostaErro('Sessão vencida ou encerrada.'),
        },
      },
    },
    '/auth/sair': {
      post: {
        tags: ['Autenticação'],
        summary: 'Encerra a sessão do aparelho',
        requestBody: {
          required: true,
          content: json({ type: 'object', properties: { tokenRenovacao: { type: 'string' } } }),
        },
        responses: { 204: { description: 'Sessão encerrada.' } },
      },
    },
    '/usuarios/eu': {
      get: {
        tags: ['Conta'],
        summary: 'Dados da conta logada',
        security: comLogin,
        responses: { 200: { description: 'Conta.', content: json(ref('Usuario')) }, 401: semLogin },
      },
      delete: {
        tags: ['Conta'],
        summary: 'Exclui a conta e todos os dados dela',
        security: comLogin,
        requestBody: {
          required: true,
          content: json({ type: 'object', properties: { senha: { type: 'string' } } }),
        },
        responses: {
          204: { description: 'Conta excluída.' },
          401: semLogin,
          403: respostaErro('Senha incorreta ou conta de demonstração.'),
        },
      },
    },
    '/lista': {
      get: {
        tags: ['Minha lista'],
        summary: 'Animes salvos, do mais recente para o mais antigo',
        security: comLogin,
        responses: {
          200: { description: 'Lista.', content: json({ type: 'array', items: ref('ItemLista') }) },
          401: semLogin,
        },
      },
    },
    '/lista/{animeId}': {
      put: {
        tags: ['Minha lista'],
        summary: 'Salva um anime na lista (idempotente)',
        security: comLogin,
        parameters: [paramAnime],
        requestBody: { required: true, content: json(ref('ItemLista')) },
        responses: {
          200: {
            description: 'Já estava na lista; dados atualizados.',
            content: json(ref('ItemLista')),
          },
          201: { description: 'Adicionado.', content: json(ref('ItemLista')) },
          401: semLogin,
          422: respostaErro('Dados inválidos ou lista cheia.'),
        },
      },
      delete: {
        tags: ['Minha lista'],
        summary: 'Tira o anime da lista',
        security: comLogin,
        parameters: [paramAnime],
        responses: { 204: { description: 'Removido.' }, 401: semLogin },
      },
    },
    '/historico': {
      get: {
        tags: ['Histórico'],
        summary: 'Últimos 200 episódios assistidos',
        security: comLogin,
        responses: {
          200: {
            description: 'Histórico.',
            content: json({ type: 'array', items: ref('RegistroHistorico') }),
          },
          401: semLogin,
        },
      },
      delete: {
        tags: ['Histórico'],
        summary: 'Limpa o histórico',
        security: comLogin,
        responses: { 204: { description: 'Histórico apagado.' }, 401: semLogin },
      },
    },
    '/historico/{animeId}/{episodio}': {
      put: {
        tags: ['Histórico'],
        summary: 'Grava onde o usuário parou o episódio',
        security: comLogin,
        parameters: [
          paramAnime,
          { name: 'episodio', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: { required: true, content: json(ref('RegistroHistorico')) },
        responses: {
          200: { description: 'Progresso atualizado.', content: json(ref('RegistroHistorico')) },
          201: {
            description: 'Primeiro registro do episódio.',
            content: json(ref('RegistroHistorico')),
          },
          401: semLogin,
          422: respostaErro('Dados inválidos.'),
        },
      },
    },
  },
};

module.exports = { documento };
