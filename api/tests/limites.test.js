'use strict';

// Limite baixo de cadastros so neste arquivo, antes de carregar a API.
process.env.LIMITE_CADASTRO = '3';

const { app, criarConta, limparBanco, request, sequelize } = require('./ajuda');

beforeAll(limparBanco);
afterAll(() => sequelize.close());

describe('limite de tentativas', () => {
  test('depois de 10 senhas erradas o login fica bloqueado', async () => {
    const conta = await criarConta();
    for (let tentativa = 0; tentativa < 10; tentativa += 1) {
      await request(app)
        .post('/v1/auth/entrar')
        .send({ email: conta.email, senha: 'errada123' })
        .expect(401);
    }
    // Nem a senha certa passa enquanto o bloqueio durar.
    const resposta = await request(app)
      .post('/v1/auth/entrar')
      .send({ email: conta.email, senha: conta.senha })
      .expect(429);
    expect(resposta.body.erro).toContain('Muitas tentativas');
  });

  test('cadastros demais a partir do mesmo IP sao barrados', async () => {
    // Uma conta ja foi criada no teste anterior; o limite deste arquivo e 3.
    await criarConta();
    await criarConta();
    const resposta = await request(app)
      .post('/v1/auth/cadastro')
      .send({ nome: 'Quarta Conta', email: 'quarta@teste.com', senha: 'senha1234' })
      .expect(429);
    expect(resposta.body.erro).toContain('Muitos cadastros');
  });
});
