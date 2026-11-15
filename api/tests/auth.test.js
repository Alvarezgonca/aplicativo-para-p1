'use strict';

const jwt = require('jsonwebtoken');

const { Sessao, Usuario } = require('../src/models');
const { app, comToken, criarConta, limparBanco, request, sequelize } = require('./ajuda');

beforeEach(limparBanco);
afterAll(() => sequelize.close());

describe('cadastro', () => {
  test('cria a conta, abre a sessao e nunca devolve a senha', async () => {
    const resposta = await request(app)
      .post('/v1/auth/cadastro')
      .send({ nome: '  Ana Souza ', email: ' Ana@Teste.COM ', senha: 'segredo123' })
      .expect(201);

    expect(resposta.body.usuario).toEqual({
      id: expect.any(String),
      nome: 'Ana Souza',
      email: 'ana@teste.com',
      criadoEm: expect.any(String),
    });
    expect(resposta.body.tokenAcesso).toEqual(expect.any(String));
    expect(resposta.body.tokenRenovacao).toHaveLength(43);
    expect(JSON.stringify(resposta.body)).not.toContain('segredo123');
    expect(JSON.stringify(resposta.body)).not.toContain('senhaHash');
  });

  test('guarda so o hash bcrypt da senha e o hash do token de renovacao', async () => {
    const conta = await criarConta({ senha: 'segredo123' });
    const usuario = await Usuario.findByPk(conta.usuario.id);
    expect(usuario.senhaHash).toMatch(/^\$2[aby]\$/);
    expect(usuario.senhaHash).not.toContain('segredo123');

    const sessao = await Sessao.findOne({ where: { usuarioId: conta.usuario.id } });
    expect(sessao.tokenHash).toHaveLength(64);
    expect(sessao.tokenHash).not.toBe(conta.tokenRenovacao);
  });

  test('recusa e-mail repetido, mesmo com letras maiusculas', async () => {
    await criarConta({ email: 'bia@teste.com' });
    const resposta = await request(app)
      .post('/v1/auth/cadastro')
      .send({ nome: 'Outra Bia', email: 'BIA@teste.com', senha: 'senha1234' })
      .expect(409);
    expect(resposta.body.erro).toBe('Já existe uma conta com este e-mail.');
  });

  test('recusa senha fraca e e-mail invalido com a lista de campos', async () => {
    const resposta = await request(app)
      .post('/v1/auth/cadastro')
      .send({ nome: 'Ana', email: 'nao-e-email', senha: 'abcdefgh' })
      .expect(422);
    const campos = resposta.body.detalhes.map((detalhe) => detalhe.campo);
    expect(campos).toEqual(expect.arrayContaining(['email', 'senha']));
  });
});

describe('login', () => {
  test('entra com e-mail e senha certos', async () => {
    const conta = await criarConta();
    const resposta = await request(app)
      .post('/v1/auth/entrar')
      .send({ email: conta.email.toUpperCase(), senha: conta.senha })
      .expect(200);
    expect(resposta.body.usuario.id).toBe(conta.usuario.id);
  });

  test('senha errada e e-mail inexistente recebem a mesma resposta', async () => {
    const conta = await criarConta();
    const senhaErrada = await request(app)
      .post('/v1/auth/entrar')
      .send({ email: conta.email, senha: 'errada123' })
      .expect(401);
    const semConta = await request(app)
      .post('/v1/auth/entrar')
      .send({ email: 'ninguem@teste.com', senha: 'errada123' })
      .expect(401);
    expect(senhaErrada.body).toEqual(semConta.body);
  });
});

describe('tokens', () => {
  test('o token de renovacao vale uma vez so (rotacao)', async () => {
    const conta = await criarConta();
    const primeira = await request(app)
      .post('/v1/auth/renovar')
      .send({ tokenRenovacao: conta.tokenRenovacao })
      .expect(200);
    expect(primeira.body.tokenRenovacao).not.toBe(conta.tokenRenovacao);

    // Reusar o token antigo (como faria quem o copiou) e recusado.
    await request(app)
      .post('/v1/auth/renovar')
      .send({ tokenRenovacao: conta.tokenRenovacao })
      .expect(401);

    // O novo continua valendo.
    await request(app)
      .post('/v1/auth/renovar')
      .send({ tokenRenovacao: primeira.body.tokenRenovacao })
      .expect(200);
  });

  test('sair encerra a sessao no servidor', async () => {
    const conta = await criarConta();
    await request(app)
      .post('/v1/auth/sair')
      .send({ tokenRenovacao: conta.tokenRenovacao })
      .expect(204);
    await request(app)
      .post('/v1/auth/renovar')
      .send({ tokenRenovacao: conta.tokenRenovacao })
      .expect(401);
  });

  test('sessao vencida nao renova', async () => {
    const conta = await criarConta();
    await Sessao.update(
      { expiraEm: new Date(Date.now() - 1000) },
      { where: { usuarioId: conta.usuario.id } },
    );
    await request(app)
      .post('/v1/auth/renovar')
      .send({ tokenRenovacao: conta.tokenRenovacao })
      .expect(401);
  });

  test('recusa token sem login, adulterado, vencido ou com alg none', async () => {
    const conta = await criarConta();
    const segredo = process.env.JWT_SECRET;
    const opcoes = { subject: conta.usuario.id, issuer: 'animes-api', audience: 'animes-app' };

    const vencido = jwt.sign({}, segredo, { ...opcoes, expiresIn: -10 });
    const outraChave = jwt.sign({}, 'outra-chave-qualquer-com-mais-de-32-letras', opcoes);
    const semAssinatura = jwt.sign({}, null, { ...opcoes, algorithm: 'none' });
    const [cabecalho, , assinatura] = conta.tokenAcesso.split('.');
    const corpoTrocado = Buffer.from(JSON.stringify({ sub: 'outro-usuario' })).toString(
      'base64url',
    );
    const adulterado = `${cabecalho}.${corpoTrocado}.${assinatura}`;

    await request(app).get('/v1/usuarios/eu').expect(401);
    for (const token of [vencido, outraChave, semAssinatura, adulterado]) {
      await request(app).get('/v1/usuarios/eu').set(comToken(token)).expect(401);
    }
    await request(app).get('/v1/usuarios/eu').set(comToken(conta.tokenAcesso)).expect(200);
  });
});
