// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Apenas saida gerada: o bundle exportado e os tipos de rota que o Expo
    // Router escreve a cada execucao. Nenhum arquivo do projeto fica de fora
    // da analise.
    ignores: ['dist/*', '.expo/*'],
  },
]);
