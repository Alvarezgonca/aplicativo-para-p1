'use strict';

const { ErroHttp } = require('../utils/erro-http');

/** Rota que nao existe. Fica depois de todas as rotas. */
function naoEncontrado(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}

/**
 * Tratador central de erros (o Express reconhece pelos quatro parametros).
 *
 * Erros previstos viram a resposta com o status deles. Os imprevistos sao
 * registrados no log do servidor e o cliente recebe so uma mensagem
 * generica: pilha de chamadas e mensagem do banco nunca saem da API, porque
 * revelariam detalhes internos a quem estivesse procurando falhas.
 */
function tratarErros(erro, req, res, next) {
  if (res.headersSent) {
    next(erro);
    return;
  }

  if (erro instanceof ErroHttp) {
    res.status(erro.status).json({
      erro: erro.message,
      ...(erro.detalhes ? { detalhes: erro.detalhes } : {}),
    });
    return;
  }

  // Erros do proprio Express ao ler o corpo da requisicao.
  if (erro.type === 'entity.parse.failed') {
    res.status(400).json({ erro: 'O corpo da requisição não é um JSON válido.' });
    return;
  }
  if (erro.type === 'entity.too.large') {
    res.status(413).json({ erro: 'O corpo da requisição é grande demais.' });
    return;
  }

  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { naoEncontrado, tratarErros };
