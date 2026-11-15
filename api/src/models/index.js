'use strict';

const { sequelize } = require('../database/conexao');
const { iniciarSessao } = require('./sessao');
const { iniciarUsuario } = require('./usuario');

/**
 * Registra os modelos na conexao e liga as relacoes entre eles.
 *
 * Usuario 1 --- N Sessao
 */
const Usuario = iniciarUsuario(sequelize);
const Sessao = iniciarSessao(sequelize);

Usuario.hasMany(Sessao, { foreignKey: 'usuarioId', as: 'sessoes', onDelete: 'CASCADE' });
Sessao.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

module.exports = { sequelize, Usuario, Sessao };
