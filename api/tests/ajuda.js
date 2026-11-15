'use strict';

const request = require('supertest');

const { criarApp } = require('../src/app');
const { config } = require('../src/config/ambiente');
const { sequelize } = require('../src/models');

const app = criarApp(config);

/** Apaga os dados entre um teste e outro, mantendo as tabelas. */
async function limparBanco() {
  await sequelize.query(
    'TRUNCATE usuarios, sessoes, itens_lista, registros_historico RESTART IDENTITY CASCADE',
  );
}

let contador = 0;

/** Cria uma conta nova e devolve os dados dela com os tokens. */
async function criarConta(dados = {}) {
  contador += 1;
  const corpo = {
    nome: 'Pessoa Teste',
    email: `pessoa${contador}@teste.com`,
    senha: 'senha1234',
    ...dados,
  };
  const resposta = await request(app).post('/v1/auth/cadastro').send(corpo).expect(201);
  return { ...resposta.body, senha: corpo.senha, email: corpo.email };
}

function comToken(token) {
  return { Authorization: `Bearer ${token}` };
}

const ANIME = {
  titulo: "Frieren: Beyond Journey's End",
  tituloRomaji: 'Sousou no Frieren',
  tituloNativo: '葬送のフリーレン',
  capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587.jpg',
  capaGrande: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587.jpg',
  capaPequena: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx154587.jpg',
  banner: null,
  cor: '#e4a15d',
  nota: 9.1,
  generos: ['Adventure', 'Drama', 'Fantasy'],
  ano: 2023,
  totalEpisodios: 28,
  formato: 'TV',
};

const EPISODIO = {
  titulo: "Frieren: Beyond Journey's End",
  capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587.jpg',
  banner: null,
  tituloEpisodio: 'O fim da jornada',
  miniatura: null,
  duracao: 24,
  progresso: 0.5,
};

module.exports = { app, request, sequelize, limparBanco, criarConta, comToken, ANIME, EPISODIO };
