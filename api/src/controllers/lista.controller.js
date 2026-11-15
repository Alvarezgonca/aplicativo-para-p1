'use strict';

const { ItemLista } = require('../models');
const { ErroHttp } = require('../utils/erro-http');

/** Teto de titulos por usuario, para ninguem encher o banco sozinho. */
const LIMITE_ITENS = 500;

/** Lista do usuario logado, do mais recente para o mais antigo. */
async function listar(req, res) {
  const itens = await ItemLista.findAll({
    where: { usuarioId: req.usuario.id },
    order: [['salvoEm', 'DESC']],
  });
  res.json(itens.map((item) => item.paraResposta()));
}

/**
 * Salva um anime na lista (ou atualiza os dados dele, se ja estava).
 *
 * PUT e idempotente: mandar o mesmo pedido duas vezes deixa o banco igual.
 * Isso importa porque o aplicativo reenvia o que ficou pendente quando
 * estava sem internet, e um reenvio nao pode duplicar o titulo.
 */
async function salvar(req, res) {
  const usuarioId = req.usuario.id;
  const { animeId } = req.parametros;
  const { salvoEm, ...dados } = req.dados;

  const existente = await ItemLista.findOne({ where: { usuarioId, animeId } });
  if (!existente && (await ItemLista.count({ where: { usuarioId } })) >= LIMITE_ITENS) {
    throw new ErroHttp(422, `Sua lista chegou ao limite de ${LIMITE_ITENS} títulos.`);
  }

  const [item] = await ItemLista.upsert(
    {
      ...dados,
      usuarioId,
      animeId,
      salvoEm: existente?.salvoEm ?? new Date(Math.min(salvoEm ?? Date.now(), Date.now())),
    },
    { conflictFields: ['usuario_id', 'anime_id'] },
  );
  res.status(existente ? 200 : 201).json(item.paraResposta());
}

/** Tira o anime da lista. Responde 204 mesmo se ele ja nao estava. */
async function remover(req, res) {
  await ItemLista.destroy({
    where: { usuarioId: req.usuario.id, animeId: req.parametros.animeId },
  });
  res.status(204).end();
}

module.exports = { listar, salvar, remover };
