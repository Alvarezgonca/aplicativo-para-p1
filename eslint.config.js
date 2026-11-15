// https://docs.expo.dev/guides/using-eslint/
const js = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  {
    // Regras do Expo para o aplicativo (React Native, hooks, rotas).
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['api/**'],
    extends: [expoConfig],
  },
  {
    // A API roda no Node, nao no celular: usa as regras recomendadas do
    // JavaScript com as variaveis globais do Node (process, require, module).
    files: ['api/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    files: ['api/tests/**/*.js'],
    languageOptions: { globals: { ...globals.jest } },
  },
  {
    // Apenas saida gerada: o bundle exportado e os tipos de rota que o Expo
    // Router escreve a cada execucao. Nenhum arquivo do projeto fica de fora
    // da analise.
    ignores: ['dist/*', '.expo/*'],
  },
]);
