'use strict';

const { RegistroHistorico } = require('../src/models');
const { EPISODIO, app, comToken, criarConta, limparBanco, request, sequelize } = require('./ajuda');

beforeEach(limparBanco);
afterAll(() => sequelize.close());

describe('historico', () => {
  test('grava e atualiza o progresso do mesmo episodio numa linha so', async () => {
    const { tokenAcesso, usuario } = await criarConta();
    await request(app)
      .put('/v1/historico/154587/3')
      .set(comToken(tokenAcesso))
      .send(EPISODIO)
      .expect(201);
    await request(app)
      .put('/v1/historico/154587/3')
      .set(comToken(tokenAcesso))
      .send({ ...EPISODIO, progresso: 0.8 })
      .expect(200);

    expect(await RegistroHistorico.count({ where: { usuarioId: usuario.id } })).toBe(1);
    const resposta = await request(app).get('/v1/historico').set(comToken(tokenAcesso));
    expect(resposta.body[0]).toMatchObject({ animeId: 154587, episodio: 3, progresso: 0.8 });
  });

  test('horario no futuro vira o horario de agora', async () => {
    const { tokenAcesso } = await criarConta();
    const resposta = await request(app)
      .put('/v1/historico/1/1')
      .set(comToken(tokenAcesso))
      .send({ ...EPISODIO, assistidoEm: Date.now() + 24 * 60 * 60 * 1000 });
    expect(new Date(resposta.body.assistidoEm).getTime()).toBeLessThanOrEqual(Date.now());
  });

  test('guarda no maximo 200 registros e descarta os mais antigos', async () => {
    const { tokenAcesso, usuario } = await criarConta();
    const base = Date.now() - 1_000_000;
    await RegistroHistorico.bulkCreate(
      Array.from({ length: 200 }, (_, indice) => ({
        ...EPISODIO,
        usuarioId: usuario.id,
        animeId: 1,
        episodio: indice + 1,
        assistidoEm: new Date(base + indice * 1000),
      })),
    );

    await request(app).put('/v1/historico/2/1').set(comToken(tokenAcesso)).send(EPISODIO);

    expect(await RegistroHistorico.count({ where: { usuarioId: usuario.id } })).toBe(200);
    // O episodio 1 era o mais antigo e saiu.
    expect(
      await RegistroHistorico.count({ where: { usuarioId: usuario.id, animeId: 1, episodio: 1 } }),
    ).toBe(0);
  });

  test('progresso fora de 0 a 1 e recusado', async () => {
    const { tokenAcesso } = await criarConta();
    await request(app)
      .put('/v1/historico/1/1')
      .set(comToken(tokenAcesso))
      .send({ ...EPISODIO, progresso: 1.5 })
      .expect(422);
  });

  test('limpar apaga so o historico de quem pediu', async () => {
    const ana = await criarConta();
    const beto = await criarConta();
    await request(app).put('/v1/historico/1/1').set(comToken(ana.tokenAcesso)).send(EPISODIO);
    await request(app).put('/v1/historico/1/1').set(comToken(beto.tokenAcesso)).send(EPISODIO);

    await request(app).delete('/v1/historico').set(comToken(ana.tokenAcesso)).expect(204);

    const daAna = await request(app).get('/v1/historico').set(comToken(ana.tokenAcesso));
    const doBeto = await request(app).get('/v1/historico').set(comToken(beto.tokenAcesso));
    expect(daAna.body).toEqual([]);
    expect(doBeto.body).toHaveLength(1);
  });
});
