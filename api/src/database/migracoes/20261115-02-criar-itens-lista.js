'use strict';

const { DataTypes, Sequelize } = require('sequelize');

/**
 * Titulos salvos na minha lista.
 *
 * O catalogo vem do AniList, entao aqui fica o id do anime la e uma copia
 * dos dados do cartaz (titulos, capas, nota). Com a copia, a lista abre sem
 * consultar o AniList titulo por titulo. O par (usuario, anime) e unico: o
 * mesmo anime nao entra duas vezes na lista de alguem.
 */
module.exports = {
  async up({ context: qi }) {
    await qi.createTable('itens_lista', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      usuario_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
      },
      anime_id: { type: DataTypes.INTEGER, allowNull: false },
      titulo: { type: DataTypes.STRING(300), allowNull: false },
      titulo_romaji: { type: DataTypes.STRING(300), allowNull: false },
      titulo_nativo: { type: DataTypes.STRING(300), allowNull: true },
      capa: { type: DataTypes.STRING(600), allowNull: false },
      capa_grande: { type: DataTypes.STRING(600), allowNull: false },
      capa_pequena: { type: DataTypes.STRING(600), allowNull: false },
      banner: { type: DataTypes.STRING(600), allowNull: true },
      cor: { type: DataTypes.STRING(7), allowNull: true },
      nota: { type: DataTypes.REAL, allowNull: true },
      generos: { type: DataTypes.ARRAY(DataTypes.STRING(40)), allowNull: false, defaultValue: [] },
      ano: { type: DataTypes.INTEGER, allowNull: true },
      total_episodios: { type: DataTypes.INTEGER, allowNull: true },
      formato: { type: DataTypes.STRING(20), allowNull: true },
      salvo_em: { type: DataTypes.DATE, allowNull: false },
      criado_em: { type: DataTypes.DATE, allowNull: false },
      atualizado_em: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addConstraint('itens_lista', {
      fields: ['usuario_id', 'anime_id'],
      type: 'unique',
      name: 'itens_lista_usuario_anime_unico',
    });
  },

  async down({ context: qi }) {
    await qi.dropTable('itens_lista');
  },
};
