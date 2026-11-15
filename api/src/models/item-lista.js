'use strict';

const { DataTypes, Model } = require('sequelize');

/** Um anime salvo na lista de um usuario. */
class ItemLista extends Model {
  paraResposta() {
    return {
      animeId: this.animeId,
      titulo: this.titulo,
      tituloRomaji: this.tituloRomaji,
      tituloNativo: this.tituloNativo,
      capa: this.capa,
      capaGrande: this.capaGrande,
      capaPequena: this.capaPequena,
      banner: this.banner,
      cor: this.cor,
      nota: this.nota,
      generos: this.generos,
      ano: this.ano,
      totalEpisodios: this.totalEpisodios,
      formato: this.formato,
      salvoEm: this.salvoEm,
    };
  }
}

function iniciarItemLista(sequelize) {
  ItemLista.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      usuarioId: { type: DataTypes.UUID, allowNull: false },
      animeId: { type: DataTypes.INTEGER, allowNull: false },
      titulo: { type: DataTypes.STRING(300), allowNull: false },
      tituloRomaji: { type: DataTypes.STRING(300), allowNull: false },
      tituloNativo: { type: DataTypes.STRING(300), allowNull: true },
      capa: { type: DataTypes.STRING(600), allowNull: false },
      capaGrande: { type: DataTypes.STRING(600), allowNull: false },
      capaPequena: { type: DataTypes.STRING(600), allowNull: false },
      banner: { type: DataTypes.STRING(600), allowNull: true },
      cor: { type: DataTypes.STRING(7), allowNull: true },
      nota: { type: DataTypes.REAL, allowNull: true },
      generos: { type: DataTypes.ARRAY(DataTypes.STRING(40)), allowNull: false, defaultValue: [] },
      ano: { type: DataTypes.INTEGER, allowNull: true },
      totalEpisodios: { type: DataTypes.INTEGER, allowNull: true },
      formato: { type: DataTypes.STRING(20), allowNull: true },
      salvoEm: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'ItemLista',
      tableName: 'itens_lista',
      indexes: [{ unique: true, fields: ['usuario_id', 'anime_id'] }],
    },
  );
  return ItemLista;
}

module.exports = { ItemLista, iniciarItemLista };
