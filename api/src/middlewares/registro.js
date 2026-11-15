'use strict';

/**
 * Uma linha de log por requisicao: metodo, caminho, status e tempo.
 *
 * O corpo nao e registrado, porque nele vao senha e token. A query string
 * tambem fica de fora pelo mesmo motivo.
 */
function registrarRequisicoes(req, res, next) {
  // A verificacao de saude do Docker roda a cada 30 segundos e so encheria o log.
  if (req.path === '/saude') {
    next();
    return;
  }
  const inicio = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    console.log(
      `${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${ms.toFixed(1)}ms`,
    );
  });
  next();
}

module.exports = { registrarRequisicoes };
