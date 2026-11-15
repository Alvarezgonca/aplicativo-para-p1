'use strict';

const { app, request, sequelize } = require('./ajuda');

afterAll(() => sequelize.close());

describe('saude e comportamento geral', () => {
  test('GET /saude confere a API e o banco', async () => {
    const resposta = await request(app).get('/saude').expect(200);
    expect(resposta.body).toEqual({ status: 'ok', banco: 'ok' });
  });

  test('rota inexistente responde 404 em JSON', async () => {
    const resposta = await request(app).get('/v1/nao-existe').expect(404);
    expect(resposta.body.erro).toBe('Rota não encontrada.');
  });

  test('JSON mal formado responde 400 sem expor detalhes', async () => {
    const resposta = await request(app)
      .post('/v1/auth/entrar')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(resposta.body).toEqual({ erro: 'O corpo da requisição não é um JSON válido.' });
  });

  test('envia cabecalhos de seguranca e esconde o X-Powered-By', async () => {
    const resposta = await request(app).get('/saude');
    expect(resposta.headers['x-content-type-options']).toBe('nosniff');
    expect(resposta.headers['strict-transport-security']).toBeDefined();
    expect(resposta.headers['x-powered-by']).toBeUndefined();
  });

  test('a documentacao fica em /docs', async () => {
    await request(app).get('/docs/').expect(200).expect('Content-Type', /html/);
  });
});
