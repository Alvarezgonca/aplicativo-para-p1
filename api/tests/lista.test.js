'use strict';

const { ItemLista } = require('../src/models');
const { ANIME, app, comToken, criarConta, limparBanco, request, sequelize } = require('./ajuda');

beforeEach(limparBanco);
afterAll(() => sequelize.close());

describe('minha lista', () => {
  test('exige login', async () => {
    await request(app).get('/v1/lista').expect(401);
    await request(app).put('/v1/lista/1').send(ANIME).expect(401);
  });

  test('salvar duas vezes o mesmo anime nao duplica (PUT idempotente)', async () => {
    const { tokenAcesso, usuario } = await criarConta();
    await request(app).put('/v1/lista/154587').set(comToken(tokenAcesso)).send(ANIME).expect(201);
    await request(app).put('/v1/lista/154587').set(comToken(tokenAcesso)).send(ANIME).expect(200);
    expect(await ItemLista.count({ where: { usuarioId: usuario.id } })).toBe(1);
  });

  test('lista do mais recente para o mais antigo', async () => {
    const { tokenAcesso } = await criarConta();
    const agora = Date.now();
    await request(app)
      .put('/v1/lista/1')
      .set(comToken(tokenAcesso))
      .send({ ...ANIME, titulo: 'Antigo', salvoEm: agora - 60_000 });
    await request(app)
      .put('/v1/lista/2')
      .set(comToken(tokenAcesso))
      .send({ ...ANIME, titulo: 'Novo', salvoEm: agora });

    const resposta = await request(app).get('/v1/lista').set(comToken(tokenAcesso)).expect(200);
    expect(resposta.body.map((item) => item.titulo)).toEqual(['Novo', 'Antigo']);
    expect(resposta.body[0]).toMatchObject({ animeId: 2, generos: ANIME.generos, nota: 9.1 });
  });

  test('um usuario nao ve nem apaga a lista de outro', async () => {
    const ana = await criarConta();
    const beto = await criarConta();
    await request(app).put('/v1/lista/10').set(comToken(ana.tokenAcesso)).send(ANIME).expect(201);

    const doBeto = await request(app).get('/v1/lista').set(comToken(beto.tokenAcesso));
    expect(doBeto.body).toEqual([]);

    await request(app).delete('/v1/lista/10').set(comToken(beto.tokenAcesso)).expect(204);
    const daAna = await request(app).get('/v1/lista').set(comToken(ana.tokenAcesso));
    expect(daAna.body).toHaveLength(1);
  });

  test('recusa imagem sem https e id que nao e numero', async () => {
    const { tokenAcesso } = await criarConta();
    await request(app)
      .put('/v1/lista/5')
      .set(comToken(tokenAcesso))
      .send({ ...ANIME, capa: 'http://exemplo.com/capa.jpg' })
      .expect(422);
    await request(app).put('/v1/lista/abc').set(comToken(tokenAcesso)).send(ANIME).expect(422);
  });

  test('remover tira o anime e responde 204 mesmo se ele ja nao estava', async () => {
    const { tokenAcesso } = await criarConta();
    await request(app).put('/v1/lista/7').set(comToken(tokenAcesso)).send(ANIME);
    await request(app).delete('/v1/lista/7').set(comToken(tokenAcesso)).expect(204);
    await request(app).delete('/v1/lista/7').set(comToken(tokenAcesso)).expect(204);
    const resposta = await request(app).get('/v1/lista').set(comToken(tokenAcesso));
    expect(resposta.body).toEqual([]);
  });
});
