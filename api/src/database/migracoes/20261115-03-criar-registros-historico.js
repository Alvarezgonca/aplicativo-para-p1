'use strict';

const { DataTypes, Sequelize } = require('sequelize');

/**
 * Historico de reproducao: um registro por episodio aberto, com o ponto
 * onde o usuario parou. O trio (usuario, anime, episodio) e unico, e o
 * indice por data deixa rapida a consulta "ultimos assistidos".
 */
module.exports = {
  async up({ context: qi }) {
    await qi.createTable('registros_historico', {
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
      episodio: { type: DataTypes.INTEGER, allowNull: false },
      titulo: { type: DataTypes.STRING(300), allowNull: false },
      capa: { type: DataTypes.STRING(600), allowNull: false },
      banner: { type: DataTypes.STRING(600), allowNull: true },
      titulo_episodio: { type: DataTypes.STRING(300), allowNull: false },
      miniatura: { type: DataTypes.STRING(600), allowNull: true },
      duracao: { type: DataTypes.INTEGER, allowNull: false },
      progresso: { type: DataTypes.REAL, allowNull: false },
      assistido_em: { type: DataTypes.DATE, allowNull: false },
      criado_em: { type: DataTypes.DATE, allowNull: false },
      atualizado_em: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addConstraint('registros_historico', {
      fields: ['usuario_id', 'anime_id', 'episodio'],
      type: 'unique',
      name: 'registros_historico_usuario_episodio_unico',
    });
    await qi.addIndex('registros_historico', ['usuario_id', 'assistido_em']);
  },

  async down({ context: qi }) {
    await qi.dropTable('registros_historico');
  },
};
