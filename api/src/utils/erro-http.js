'use strict';

/**
 * Erro com codigo HTTP.
 *
 * Controllers e middlewares lancam este erro quando a falha e do pedido
 * (dados invalidos, sem permissao, recurso inexistente). O tratador central
 * transforma em resposta JSON com o status certo. Qualquer outro erro e
 * tratado como falha interna e nao tem a mensagem exposta ao cliente.
 */
class ErroHttp extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.name = 'ErroHttp';
    this.status = status;
    this.detalhes = detalhes;
  }
}

module.exports = { ErroHttp };
