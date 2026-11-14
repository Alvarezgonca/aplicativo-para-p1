/**
 * Tipos usados pelas telas.
 *
 * A API devolve objetos grandes, com nomes em ingles e muitos campos opcionais.
 * A camada de servico converte essas respostas nos tipos abaixo, que trazem so
 * o que o aplicativo exibe. Se a API mudar, a correcao fica no servico e as
 * telas continuam iguais.
 */

/** Dados minimos de um anime, usados em cartazes, carrosseis e grades. */
export interface AnimeResumo {
  id: number;
  /** Titulo em ingles quando existe; senao, o titulo japones romanizado. */
  titulo: string;
  tituloRomaji: string;
  tituloNativo: string | null;
  /** Poster vertical em tamanho medio, suficiente para as grades. */
  capa: string;
  /** Poster vertical em tamanho grande, para telas de destaque. */
  capaGrande: string;
  /** Poster pequeno, usado quando a economia de dados esta ligada. */
  capaPequena: string;
  /** Imagem horizontal; nem todo titulo tem uma. */
  banner: string | null;
  /** Cor predominante da capa, usada como fundo enquanto a imagem carrega. */
  cor: string | null;
  /** Nota media de 0 a 10, ou nulo quando ainda nao ha avaliacoes. */
  nota: number | null;
  generos: string[];
  ano: number | null;
  totalEpisodios: number | null;
  formato: string | null;
}

export interface Episodio {
  numero: number;
  titulo: string;
  miniatura: string | null;
}

export interface PersonagemResumo {
  id: number;
  nome: string;
  imagem: string;
  papel: string;
  /** Dublador japones principal, quando informado. */
  dublador: string | null;
}

export interface AnimeDetalhe extends AnimeResumo {
  sinopse: string;
  /** Duracao media de cada episodio, em minutos. */
  duracao: number | null;
  situacao: string;
  estudio: string | null;
  origem: string | null;
  /** Proximo episodio inedito; o horario fica em milissegundos (Date.getTime). */
  proximoEpisodio: { numero: number; horario: number } | null;
  /** Identificador do trailer no YouTube. */
  trailer: string | null;
  episodios: Episodio[];
  personagens: PersonagemResumo[];
  recomendacoes: AnimeResumo[];
}

export interface PersonagemDetalhe {
  id: number;
  nome: string;
  nomeNativo: string | null;
  imagem: string;
  descricao: string;
  idade: string | null;
  genero: string | null;
  aniversario: string | null;
  favoritos: number;
  aparicoes: AnimeResumo[];
}

/** Um episodio previsto na grade de exibicao. */
export interface Lancamento {
  id: number;
  episodio: number;
  /**
   * Horario de exibicao em milissegundos. Fica como numero, e nao como Date,
   * porque estes dados sao gravados em cache como JSON, e o JSON nao tem tipo
   * de data: um Date voltaria do disco como texto.
   */
  horario: number;
  anime: AnimeResumo;
}

/** Fatia de uma lista paginada. */
export interface Pagina<T> {
  itens: T[];
  temMais: boolean;
}

export interface SecoesInicio {
  destaques: AnimeResumo[];
  temporada: AnimeResumo[];
  populares: AnimeResumo[];
  melhores: AnimeResumo[];
}

/** Criterios de ordenacao da tela de ranking. */
export type CriterioRanking = 'em-alta' | 'temporada' | 'populares' | 'melhores';
