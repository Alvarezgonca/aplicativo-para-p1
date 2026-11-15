'use strict';

const { DataTypes, Model } = require('sequelize');

/**
 * Sessao aberta em um aparelho.
 *
 * Existe enquanto o token de renovacao dela for valido. Sair da conta apaga
 * a sessao; renovar troca o token (e o hash guardado aqui) por um novo.
 */
class Sessao extends Model {
  get expirada() {
    return this.expiraEm.getTime() <= Date.now();
  }
}

function iniciarSessao(sequelize) {
  Sessao.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      usuarioId: { type: DataTypes.UUID, allowNull: false },
      tokenHash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
      dispositivo: { type: DataTypes.STRING(120), allowNull: true },
      expiraEm: { type: DataTypes.DATE, allowNull: false },
    },
    { sequelize, modelName: 'Sessao', tableName: 'sessoes' },
  );
  return Sessao;
}

module.exports = { Sessao, iniciarSessao };
