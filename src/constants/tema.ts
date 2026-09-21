/**
 * Identidade visual do aplicativo.
 *
 * Centraliza cores, espacamentos, raios de borda e tipografia. Nenhum valor
 * literal de cor ou medida deve ser escrito direto nas telas: tudo passa por
 * aqui, de modo que um ajuste de identidade seja feito em um unico lugar.
 */

export const Cores = {
  /** Laranja da marca, usado em acoes primarias e destaques. */
  marca: '#F47521',
  marcaEscura: '#C25A15',

  /** Fundos, do mais profundo ao mais claro. */
  fundo: '#000000',
  superficie: '#141519',
  superficieAlta: '#23252B',
  divisoria: '#2F323A',

  /** Textos, em ordem decrescente de importancia. */
  texto: '#FFFFFF',
  textoSecundario: '#A0A3AD',
  textoTerciario: '#6B6F7B',

  /** Cores de apoio. */
  dourado: '#FFC107',
  sucesso: '#3ECF8E',
  erro: '#E5484D',
  transparente: 'transparent',
} as const;

export const Espacamento = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Raio = {
  sm: 4,
  md: 8,
  lg: 12,
  pilula: 999,
} as const;

export const Fonte = {
  minuscula: 11,
  pequena: 13,
  corpo: 15,
  titulo: 18,
  destaque: 22,
  heroi: 28,
} as const;

/**
 * Altura reservada para a barra de abas inferior. As telas com rolagem usam
 * este valor como espaco extra no final do conteudo, para que o ultimo item
 * nao fique escondido atras da barra.
 */
export const AlturaBarraAbas = 64;
