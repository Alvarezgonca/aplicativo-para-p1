import { Anime, animes } from './animes';

export interface Colecao {
  id: string;
  titulo: string;
  animes: Anime[];
}

const porId = (...ids: number[]): Anime[] =>
  ids
    .map((id) => animes.find((anime) => anime.id === id))
    .filter((anime): anime is Anime => anime !== undefined);

/**
 * Secoes horizontais da tela inicial, na ordem em que aparecem.
 *
 * As listas sao montadas a partir do catalogo por identificador, e nao por
 * copia dos objetos, para que exista uma unica fonte de verdade por anime.
 */
export const colecoes: Colecao[] = [
  {
    id: 'populares',
    titulo: 'Populares agora',
    animes: porId(3, 9, 2, 13, 14, 11, 4, 10),
  },
  {
    id: 'dublados',
    titulo: 'Dublados em portugues',
    animes: animes.filter((anime) => anime.dublado),
  },
  {
    id: 'aclamados',
    titulo: 'Aclamados pela critica',
    animes: [...animes].sort((a, b) => b.nota - a.nota).slice(0, 8),
  },
  {
    id: 'acao',
    titulo: 'Acao e aventura',
    animes: animes.filter((anime) => anime.generos.includes('Ação')),
  },
  {
    id: 'leves',
    titulo: 'Para assistir sem compromisso',
    animes: porId(7, 5, 16, 17, 10),
  },
];

/** Conjunto de generos presentes no catalogo, em ordem alfabetica. */
export const generosDisponiveis: string[] = Array.from(
  new Set(animes.flatMap((anime) => anime.generos)),
).sort((a, b) => a.localeCompare(b, 'pt-BR'));
