'use strict';

const { garantirContaDemonstracao } = require('../src/database/semear');
const { ItemLista, RegistroHistorico, Sessao } = require('../src/models');
const {
  ANIME,
  EPISODIO,
  app,
  comToken,
  criarConta,
  limparBanco,
  request,
  sequelize,
} = require('./ajuda');

beforeEach(limparBanco);
afterAll(() => sequelize.close());

describe('conta', () => {
  test('GET /usuarios/eu devolve o dono do token', async () => {
    const conta = await criarConta({ nome: 'Carla Dias' });
    const resposta = await request(app)
      .get('/v1/usuarios/eu')
      .set(comToken(conta.tokenAcesso))
      .expect(200);
    expect(resposta.body).toEqual(conta.usuario);
  });

  test('excluir pede a senha certa', async () => {
    const conta = await criarConta();
    await request(app)
      .delete('/v1/usuarios/eu')
      .set(comToken(conta.tokenAcesso))
      .send({ senha: 'errada123' })
      .expect(403);
    await request(app).get('/v1/usuarios/eu').set(comToken(conta.tokenAcesso)).expect(200);
  });

  test('excluir apaga a conta, as sessoes, a lista e o historico', async () => {
    const conta = await criarConta();
    const cabecalho = comToken(conta.tokenAcesso);
    await request(app).put('/v1/lista/1').set(cabecalho).send(ANIME);
    await request(app).put('/v1/historico/1/1').set(cabecalho).send(EPISODIO);

    await request(app)
      .delete('/v1/usuarios/eu')
      .set(cabecalho)
      .send({ senha: conta.senha })
      .expect(204);

    const onde = { where: { usuarioId: conta.usuario.id } };
    expect(await Sessao.count(onde)).toBe(0);
    expect(await ItemLista.count(onde)).toBe(0);
    expect(await RegistroHistorico.count(onde)).toBe(0);
    // O token de acesso ainda nao venceu, mas a conta nao existe mais.
    await request(app).get('/v1/usuarios/eu').set(cabecalho).expect(401);
  });

  test('a conta de demonstracao existe e nao pode ser excluida', async () => {
    await garantirContaDemonstracao();
    await garantirContaDemonstracao();
    const login = await request(app)
      .post('/v1/auth/entrar')
      .send({ email: 'demo@exemplo.com', senha: 'demo1234' })
      .expect(200);
    await request(app)
      .delete('/v1/usuarios/eu')
      .set(comToken(login.body.tokenAcesso))
      .send({ senha: 'demo1234' })
      .expect(403);
  });
});
