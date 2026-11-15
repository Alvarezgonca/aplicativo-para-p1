'use strict';

const { sequelize } = require('../database/conexao');
const { iniciarItemLista } = require('./item-lista');
const { iniciarRegistroHistorico } = require('./registro-historico');
const { iniciarSessao } = require('./sessao');
const { iniciarUsuario } = require('./usuario');

/**
 * Registra os modelos na conexao e liga as relacoes entre eles.
 *
 * Usuario 1 --- N Sessao
 * Usuario 1 --- N ItemLista
 * Usuario 1 --- N RegistroHistorico
 */
const Usuario = iniciarUsuario(sequelize);
const Sessao = iniciarSessao(sequelize);
const ItemLista = iniciarItemLista(sequelize);
const RegistroHistorico = iniciarRegistroHistorico(sequelize);

Usuario.hasMany(Sessao, { foreignKey: 'usuarioId', as: 'sessoes', onDelete: 'CASCADE' });
Sessao.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

Usuario.hasMany(ItemLista, { foreignKey: 'usuarioId', as: 'lista', onDelete: 'CASCADE' });
ItemLista.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

Usuario.hasMany(RegistroHistorico, {
  foreignKey: 'usuarioId',
  as: 'historico',
  onDelete: 'CASCADE',
});
RegistroHistorico.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

module.exports = { sequelize, Usuario, Sessao, ItemLista, RegistroHistorico };
