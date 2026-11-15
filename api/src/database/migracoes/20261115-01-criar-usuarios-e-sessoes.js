'use strict';

const { DataTypes, Sequelize } = require('sequelize');

/**
 * Contas de usuario e sessoes abertas.
 *
 * A senha nunca e gravada: so o hash bcrypt dela. Cada sessao guarda o hash
 * do token de renovacao (e nao o token), entao quem ler o banco nao consegue
 * se passar por ninguem. Apagar o usuario apaga as sessoes dele em cascata.
 */
module.exports = {
  async up({ context: qi }) {
    await qi.createTable('usuarios', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      nome: { type: DataTypes.STRING(80), allowNull: false },
      email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
      senha_hash: { type: DataTypes.STRING(100), allowNull: false },
      demo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      criado_em: { type: DataTypes.DATE, allowNull: false },
      atualizado_em: { type: DataTypes.DATE, allowNull: false },
    });

    await qi.createTable('sessoes', {
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
      token_hash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
      dispositivo: { type: DataTypes.STRING(120), allowNull: true },
      expira_em: { type: DataTypes.DATE, allowNull: false },
      criado_em: { type: DataTypes.DATE, allowNull: false },
      atualizado_em: { type: DataTypes.DATE, allowNull: false },
    });
    await qi.addIndex('sessoes', ['usuario_id']);
  },

  async down({ context: qi }) {
    await qi.dropTable('sessoes');
    await qi.dropTable('usuarios');
  },
};
