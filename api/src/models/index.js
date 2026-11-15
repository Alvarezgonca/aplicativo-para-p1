'use strict';

const { sequelize } = require('../database/conexao');
const { iniciarItemLista } = require('./item-lista');
const { iniciarSessao } = require('./sessao');
const { iniciarUsuario } = require('./usuario');

/**
 * Registra os modelos na conexao e liga as relacoes entre eles.
 *
 * Usuario 1 --- N Sessao
 * Usuario 1 --- N ItemLista
 */
const Usuario = iniciarUsuario(sequelize);
const Sessao = iniciarSessao(sequelize);
const ItemLista = iniciarItemLista(sequelize);

Usuario.hasMany(Sessao, { foreignKey: 'usuarioId', as: 'sessoes', onDelete: 'CASCADE' });
Sessao.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

Usuario.hasMany(ItemLista, { foreignKey: 'usuarioId', as: 'lista', onDelete: 'CASCADE' });
ItemLista.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

module.exports = { sequelize, Usuario, Sessao, ItemLista };
