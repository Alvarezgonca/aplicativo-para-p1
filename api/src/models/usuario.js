'use strict';

const { DataTypes, Model } = require('sequelize');

/** Conta de quem usa o aplicativo. */
class Usuario extends Model {
  /**
   * O que pode sair da API sobre o usuario. O hash da senha e a marca de
   * conta de demonstracao ficam so no servidor.
   */
  paraResposta() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      criadoEm: this.criadoEm,
    };
  }
}

function iniciarUsuario(sequelize) {
  Usuario.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      nome: { type: DataTypes.STRING(80), allowNull: false },
      email: {
        type: DataTypes.STRING(254),
        allowNull: false,
        unique: true,
        // E-mail e guardado sempre em minusculas, para Ana@x.com e ana@x.com
        // serem a mesma conta.
        set(valor) {
          this.setDataValue('email', String(valor).trim().toLowerCase());
        },
      },
      senhaHash: { type: DataTypes.STRING(100), allowNull: false },
      demo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { sequelize, modelName: 'Usuario', tableName: 'usuarios' },
  );
  return Usuario;
}

module.exports = { Usuario, iniciarUsuario };
