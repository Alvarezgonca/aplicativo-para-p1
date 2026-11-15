'use strict';

const { DataTypes, Model } = require('sequelize');

/** Um episodio assistido (inteiro ou em parte) por um usuario. */
class RegistroHistorico extends Model {
  paraResposta() {
    return {
      animeId: this.animeId,
      episodio: this.episodio,
      titulo: this.titulo,
      capa: this.capa,
      banner: this.banner,
      tituloEpisodio: this.tituloEpisodio,
      miniatura: this.miniatura,
      duracao: this.duracao,
      progresso: this.progresso,
      assistidoEm: this.assistidoEm,
    };
  }
}

function iniciarRegistroHistorico(sequelize) {
  RegistroHistorico.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      usuarioId: { type: DataTypes.UUID, allowNull: false },
      animeId: { type: DataTypes.INTEGER, allowNull: false },
      episodio: { type: DataTypes.INTEGER, allowNull: false },
      titulo: { type: DataTypes.STRING(300), allowNull: false },
      capa: { type: DataTypes.STRING(600), allowNull: false },
      banner: { type: DataTypes.STRING(600), allowNull: true },
      tituloEpisodio: { type: DataTypes.STRING(300), allowNull: false },
      miniatura: { type: DataTypes.STRING(600), allowNull: true },
      duracao: { type: DataTypes.INTEGER, allowNull: false },
      progresso: { type: DataTypes.REAL, allowNull: false },
      assistidoEm: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'RegistroHistorico',
      tableName: 'registros_historico',
      indexes: [{ unique: true, fields: ['usuario_id', 'anime_id', 'episodio'] }],
    },
  );
  return RegistroHistorico;
}

module.exports = { RegistroHistorico, iniciarRegistroHistorico };
