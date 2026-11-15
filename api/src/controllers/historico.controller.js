'use strict';

const { RegistroHistorico, sequelize } = require('../models');

/** Quantos registros cada usuario guarda; os mais antigos saem primeiro. */
const LIMITE_REGISTROS = 200;

async function listar(req, res) {
  const registros = await RegistroHistorico.findAll({
    where: { usuarioId: req.usuario.id },
    order: [['assistidoEm', 'DESC']],
    limit: LIMITE_REGISTROS,
  });
  res.json(registros.map((registro) => registro.paraResposta()));
}

/**
 * Grava o progresso de um episodio. O aplicativo chama a cada poucos
 * segundos enquanto o episodio toca, sempre com o mesmo endereco
 * (/historico/:animeId/:episodio), entao o PUT so atualiza a mesma linha.
 *
 * O momento vem do aparelho, porque o envio pode atrasar quando o celular
 * esta sem internet; um horario no futuro e trocado pelo de agora.
 */
async function registrar(req, res) {
  const usuarioId = req.usuario.id;
  const { animeId, episodio } = req.parametros;
  const { assistidoEm, ...dados } = req.dados;

  const existente = await RegistroHistorico.findOne({ where: { usuarioId, animeId, episodio } });
  const [registro] = await RegistroHistorico.upsert(
    {
      ...dados,
      usuarioId,
      animeId,
      episodio,
      assistidoEm: new Date(Math.min(assistidoEm ?? Date.now(), Date.now())),
    },
    { conflictFields: ['usuario_id', 'anime_id', 'episodio'] },
  );

  if (!existente) {
    // Registro novo: apaga o que passou do limite, do mais antigo para o
    // mais novo. Os valores vao como parametros ($1, $2), nunca no texto.
    await sequelize.query(
      `DELETE FROM registros_historico
        WHERE usuario_id = $1
          AND id NOT IN (
            SELECT id FROM registros_historico
             WHERE usuario_id = $1
             ORDER BY assistido_em DESC
             LIMIT $2)`,
      { bind: [usuarioId, LIMITE_REGISTROS] },
    );
  }

  res.status(existente ? 200 : 201).json(registro.paraResposta());
}

/** Limpa todo o historico do usuario. */
async function limpar(req, res) {
  await RegistroHistorico.destroy({ where: { usuarioId: req.usuario.id } });
  res.status(204).end();
}

module.exports = { listar, registrar, limpar };
