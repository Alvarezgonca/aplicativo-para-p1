import { ErroApi, requisitar } from '@/services/api';
import type {
  AnimeDetalhe,
  AnimeResumo,
  CriterioRanking,
  Episodio,
  Lancamento,
  Pagina,
  PersonagemDetalhe,
  PersonagemResumo,
  SecoesInicio,
} from '@/services/tipos';

/**
 * Catalogo de animes, servido pela API publica do AniList.
 *
 * O AniList usa GraphQL: existe um unico endereco e toda consulta e um POST
 * cujo corpo, em JSON, diz quais campos devem voltar. Isso permite pedir
 * exatamente o que a tela usa e, na tela inicial, buscar quatro listas em uma
 * unica requisicao. A API e aberta e nao exige chave, entao nenhum segredo
 * fica no aplicativo.
 */

const URL_API = process.env.EXPO_PUBLIC_ANILIST_URL ?? 'https://graphql.anilist.co';

/** Itens por pagina nas listas com rolagem infinita. */
const POR_PAGINA = 24;

/**
 * Lancamentos de titulos com pouca audiencia sao omitidos da grade, como faz
 * o aplicativo original, que destaca so os simulcasts mais acompanhados.
 */
const POPULARIDADE_MINIMA_GRADE = 5000;

/* ------------------------------------------------------------------------ */
/* Formato das respostas da API                                              */
/* ------------------------------------------------------------------------ */

interface MidiaApi {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { extraLarge: string; large: string; medium: string; color: string | null };
  bannerImage: string | null;
  averageScore: number | null;
  genres: string[];
  seasonYear: number | null;
  episodes: number | null;
  format: string | null;
}

interface MidiaDetalheApi extends MidiaApi {
  description: string | null;
  duration: number | null;
  status: string;
  source: string | null;
  studios: { nodes: { name: string }[] };
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  trailer: { id: string; site: string } | null;
  streamingEpisodes: { title: string; thumbnail: string }[];
  characters: { edges: ArestaPersonagemApi[] };
  recommendations: { nodes: { mediaRecommendation: MidiaApi | null }[] };
}

interface ArestaPersonagemApi {
  role: string;
  node: { id: number; name: { full: string }; image: { large: string } };
  voiceActors: { name: { full: string } }[];
}

interface PaginaApi<T> {
  Page: { pageInfo: { hasNextPage: boolean } } & T;
}

interface RespostaGraphQL<T> {
  data: T | null;
  errors?: { message: string; status?: number }[];
}

/* ------------------------------------------------------------------------ */
/* Consultas                                                                 */
/* ------------------------------------------------------------------------ */

/** Campos comuns a todo cartaz, reaproveitados pelas consultas. */
const FRAGMENTO_RESUMO = `
  fragment Resumo on Media {
    id
    title { romaji english native }
    coverImage { extraLarge large medium color }
    bannerImage
    averageScore
    genres
    seasonYear
    episodes
    format
  }
`;

const CONSULTA_INICIO = `
  query ($temporada: MediaSeason, $ano: Int) {
    destaques: Page(perPage: 10) {
      media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { ...Resumo }
    }
    temporada: Page(perPage: 15) {
      media(type: ANIME, season: $temporada, seasonYear: $ano, sort: POPULARITY_DESC, isAdult: false) { ...Resumo }
    }
    populares: Page(perPage: 15) {
      media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { ...Resumo }
    }
    melhores: Page(perPage: 15) {
      media(type: ANIME, sort: SCORE_DESC, isAdult: false) { ...Resumo }
    }
  }
`;

const CONSULTA_LISTA = `
  query ($pagina: Int, $porPagina: Int, $busca: String, $genero: String, $ordem: [MediaSort], $temporada: MediaSeason, $ano: Int) {
    Page(page: $pagina, perPage: $porPagina) {
      pageInfo { hasNextPage }
      media(type: ANIME, isAdult: false, search: $busca, genre: $genero, sort: $ordem, season: $temporada, seasonYear: $ano) { ...Resumo }
    }
  }
`;

const CONSULTA_DETALHE = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      ...Resumo
      description(asHtml: false)
      duration
      status
      source
      studios(isMain: true) { nodes { name } }
      nextAiringEpisode { episode airingAt }
      trailer { id site }
      streamingEpisodes { title thumbnail }
      characters(sort: [ROLE, RELEVANCE, ID], perPage: 12) {
        edges {
          role
          node { id name { full } image { large } }
          voiceActors(language: JAPANESE, sort: RELEVANCE) { name { full } }
        }
      }
      recommendations(sort: RATING_DESC, perPage: 12) {
        nodes { mediaRecommendation { ...Resumo } }
      }
    }
  }
`;

const CONSULTA_PERSONAGENS = `
  query ($id: Int, $pagina: Int) {
    Media(id: $id, type: ANIME) {
      characters(page: $pagina, perPage: 25, sort: [ROLE, RELEVANCE, ID]) {
        pageInfo { hasNextPage }
        edges {
          role
          node { id name { full } image { large } }
          voiceActors(language: JAPANESE, sort: RELEVANCE) { name { full } }
        }
      }
    }
  }
`;

const CONSULTA_PERSONAGEM = `
  query ($id: Int) {
    Character(id: $id) {
      id
      name { full native }
      image { large }
      description(asHtml: false)
      gender
      age
      dateOfBirth { day month }
      favourites
      media(sort: POPULARITY_DESC, type: ANIME, perPage: 12) { nodes { ...Resumo } }
    }
  }
`;

const CONSULTA_GRADE = `
  query ($inicio: Int, $fim: Int) {
    Page(perPage: 50) {
      airingSchedules(airingAt_greater: $inicio, airingAt_lesser: $fim, sort: TIME) {
        id
        episode
        airingAt
        media { ...Resumo isAdult popularity }
      }
    }
  }
`;

const CONSULTA_GENEROS = `query { GenreCollection }`;

/**
 * Envia uma consulta GraphQL e devolve o campo data da resposta.
 *
 * O fragmento de resumo so e anexado quando a consulta o utiliza: o GraphQL
 * recusa documentos com fragmentos declarados e nao usados. Variaveis com
 * valor undefined desaparecem no JSON.stringify, o que equivale a nao aplicar
 * aquele filtro.
 */
async function consultar<T>(consulta: string, variaveis: Record<string, unknown> = {}): Promise<T> {
  const documento = consulta.includes('...Resumo') ? consulta + FRAGMENTO_RESUMO : consulta;

  const resposta = await requisitar<RespostaGraphQL<T>>(URL_API, {
    method: 'POST',
    body: JSON.stringify({ query: documento, variables: variaveis }),
  });

  // No GraphQL o status HTTP pode ser 200 e ainda assim trazer erros.
  if (resposta.errors?.length || !resposta.data) {
    const primeiro = resposta.errors?.[0];
    if (primeiro?.status === 404) {
      throw new ErroApi('Conteúdo não encontrado.', 404);
    }
    throw new ErroApi('Não foi possível carregar os dados agora.', primeiro?.status ?? 0);
  }

  return resposta.data;
}

/* ------------------------------------------------------------------------ */
/* Conversao para os tipos do aplicativo                                     */
/* ------------------------------------------------------------------------ */

const GENEROS: Record<string, string> = {
  Action: 'Ação',
  Adventure: 'Aventura',
  Comedy: 'Comédia',
  Drama: 'Drama',
  Fantasy: 'Fantasia',
  Horror: 'Terror',
  'Mahou Shoujo': 'Garota mágica',
  Mecha: 'Mecha',
  Music: 'Música',
  Mystery: 'Mistério',
  Psychological: 'Psicológico',
  Romance: 'Romance',
  'Sci-Fi': 'Ficção científica',
  'Slice of Life': 'Cotidiano',
  Sports: 'Esportes',
  Supernatural: 'Sobrenatural',
  Thriller: 'Suspense',
};

/** Nome do genero em portugues. O valor original continua sendo o usado na API. */
export function traduzirGenero(genero: string): string {
  return GENEROS[genero] ?? genero;
}

const FORMATOS: Record<string, string> = {
  TV: 'Série',
  TV_SHORT: 'Série curta',
  MOVIE: 'Filme',
  SPECIAL: 'Especial',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Clipe',
};

const SITUACOES: Record<string, string> = {
  FINISHED: 'Finalizado',
  RELEASING: 'Em exibição',
  NOT_YET_RELEASED: 'Em breve',
  CANCELLED: 'Cancelado',
  HIATUS: 'Em pausa',
};

const ORIGENS: Record<string, string> = {
  ORIGINAL: 'Roteiro original',
  MANGA: 'Mangá',
  LIGHT_NOVEL: 'Light novel',
  WEB_NOVEL: 'Web novel',
  NOVEL: 'Romance',
  VIDEO_GAME: 'Videogame',
  VISUAL_NOVEL: 'Visual novel',
  WEB_MANGA: 'Mangá digital',
};

const PAPEIS: Record<string, string> = {
  MAIN: 'Protagonista',
  SUPPORTING: 'Coadjuvante',
  BACKGROUND: 'Figurante',
};

/**
 * Remove a marcacao que a API mistura aos textos: tags HTML, links e
 * negritos em Markdown e trechos marcados como spoiler.
 */
export function limparTexto(texto: string | null): string {
  if (!texto) {
    return '';
  }
  return texto
    .replace(/~!([\s\S]*?)!~/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|\s)_([^_]+)_/g, '$1$2')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function paraResumo(midia: MidiaApi): AnimeResumo {
  return {
    id: midia.id,
    titulo: midia.title.english ?? midia.title.romaji,
    tituloRomaji: midia.title.romaji,
    tituloNativo: midia.title.native,
    capa: midia.coverImage.large,
    capaGrande: midia.coverImage.extraLarge,
    banner: midia.bannerImage,
    cor: midia.coverImage.color,
    // A API da a nota de 0 a 100; o aplicativo exibe de 0 a 10.
    nota: midia.averageScore === null ? null : midia.averageScore / 10,
    generos: midia.genres.filter((genero) => genero in GENEROS).map(traduzirGenero),
    ano: midia.seasonYear,
    totalEpisodios: midia.episodes,
    formato: midia.format ? (FORMATOS[midia.format] ?? midia.format) : null,
  };
}

function paraPersonagem(aresta: ArestaPersonagemApi): PersonagemResumo {
  return {
    id: aresta.node.id,
    nome: aresta.node.name.full,
    imagem: aresta.node.image.large,
    papel: PAPEIS[aresta.role] ?? aresta.role,
    dublador: aresta.voiceActors[0]?.name.full ?? null,
  };
}

/**
 * Monta a lista de episodios.
 *
 * Quando o titulo esta em servico de streaming, a API traz o nome e a
 * miniatura de cada episodio no formato "Episode 3 - Titulo". Sem essa
 * informacao, a lista e gerada pela quantidade de episodios ja exibidos.
 */
function montarEpisodios(midia: MidiaDetalheApi): Episodio[] {
  const lidos = midia.streamingEpisodes
    .map((item): Episodio | null => {
      const partes = /Episode\s+(\d+)\s*-\s*(.*)/i.exec(item.title);
      if (!partes) {
        return null;
      }
      return { numero: Number(partes[1]), titulo: partes[2].trim(), miniatura: item.thumbnail };
    })
    .filter((item): item is Episodio => item !== null);

  if (lidos.length > 0) {
    // Remove repetidos (o mesmo episodio em mais de um servico) e ordena.
    const unicos = new Map(lidos.map((episodio) => [episodio.numero, episodio]));
    return [...unicos.values()].sort((a, b) => a.numero - b.numero);
  }

  const exibidos = midia.nextAiringEpisode
    ? midia.nextAiringEpisode.episode - 1
    : (midia.episodes ?? 0);

  return Array.from({ length: exibidos }, (_, indice) => ({
    numero: indice + 1,
    titulo: `Episódio ${indice + 1}`,
    miniatura: midia.bannerImage,
  }));
}

/** Estacao do ano no calendario de animes, que comeca o inverno em dezembro. */
function temporadaAtual(hoje = new Date()): { temporada: string; ano: number } {
  const mes = hoje.getMonth();
  if (mes === 11) return { temporada: 'WINTER', ano: hoje.getFullYear() + 1 };
  if (mes <= 1) return { temporada: 'WINTER', ano: hoje.getFullYear() };
  if (mes <= 4) return { temporada: 'SPRING', ano: hoje.getFullYear() };
  if (mes <= 7) return { temporada: 'SUMMER', ano: hoje.getFullYear() };
  return { temporada: 'FALL', ano: hoje.getFullYear() };
}

const ORDENS: Record<CriterioRanking, string> = {
  'em-alta': 'TRENDING_DESC',
  temporada: 'POPULARITY_DESC',
  populares: 'POPULARITY_DESC',
  melhores: 'SCORE_DESC',
};

/* ------------------------------------------------------------------------ */
/* Funcoes usadas pelas telas                                                */
/* ------------------------------------------------------------------------ */

type ListaMidias = { media: MidiaApi[] };

async function listar(variaveis: Record<string, unknown>): Promise<Pagina<AnimeResumo>> {
  const dados = await consultar<PaginaApi<ListaMidias>>(CONSULTA_LISTA, {
    porPagina: POR_PAGINA,
    ...variaveis,
  });
  return {
    itens: dados.Page.media.map(paraResumo),
    temMais: dados.Page.pageInfo.hasNextPage,
  };
}

export const catalogo = {
  /** As quatro fileiras da tela inicial, em uma unica requisicao. */
  async inicio(): Promise<SecoesInicio> {
    const dados = await consultar<Record<keyof SecoesInicio, ListaMidias>>(
      CONSULTA_INICIO,
      temporadaAtual(),
    );
    return {
      // O banner rotativo so aceita titulos com imagem horizontal.
      destaques: dados.destaques.media.filter((midia) => midia.bannerImage).map(paraResumo).slice(0, 6),
      temporada: dados.temporada.media.map(paraResumo),
      populares: dados.populares.media.map(paraResumo),
      melhores: dados.melhores.media.map(paraResumo),
    };
  },

  ranking(criterio: CriterioRanking, pagina: number): Promise<Pagina<AnimeResumo>> {
    return listar({
      pagina,
      ordem: [ORDENS[criterio]],
      ...(criterio === 'temporada' ? temporadaAtual() : {}),
    });
  },

  buscar(texto: string, pagina: number): Promise<Pagina<AnimeResumo>> {
    return listar({ pagina, busca: texto, ordem: ['SEARCH_MATCH'] });
  },

  /** Recebe o nome do genero como a API conhece (em ingles). */
  porGenero(genero: string, pagina: number): Promise<Pagina<AnimeResumo>> {
    return listar({ pagina, genero, ordem: ['POPULARITY_DESC'] });
  },

  /** Generos disponiveis, ja sem as categorias de conteudo adulto. */
  async generos(): Promise<{ original: string; nome: string }[]> {
    const dados = await consultar<{ GenreCollection: string[] }>(CONSULTA_GENEROS);
    return dados.GenreCollection.filter((genero) => genero in GENEROS).map((genero) => ({
      original: genero,
      nome: traduzirGenero(genero),
    }));
  },

  async anime(id: number): Promise<AnimeDetalhe> {
    const { Media: midia } = await consultar<{ Media: MidiaDetalheApi }>(CONSULTA_DETALHE, { id });

    return {
      ...paraResumo(midia),
      sinopse: limparTexto(midia.description),
      duracao: midia.duration,
      situacao: SITUACOES[midia.status] ?? midia.status,
      estudio: midia.studios.nodes[0]?.name ?? null,
      origem: midia.source ? (ORIGENS[midia.source] ?? null) : null,
      proximoEpisodio: midia.nextAiringEpisode
        ? {
            numero: midia.nextAiringEpisode.episode,
            // A API informa o horario em segundos desde 1970.
            horario: midia.nextAiringEpisode.airingAt * 1000,
          }
        : null,
      trailer: midia.trailer?.site === 'youtube' ? midia.trailer.id : null,
      episodios: montarEpisodios(midia),
      personagens: midia.characters.edges.map(paraPersonagem),
      recomendacoes: midia.recommendations.nodes
        .map((no) => no.mediaRecommendation)
        .filter((midiaRecomendada): midiaRecomendada is MidiaApi => midiaRecomendada !== null)
        .map(paraResumo),
    };
  },

  async personagens(animeId: number, pagina: number): Promise<Pagina<PersonagemResumo>> {
    const dados = await consultar<{
      Media: { characters: { pageInfo: { hasNextPage: boolean }; edges: ArestaPersonagemApi[] } };
    }>(CONSULTA_PERSONAGENS, { id: animeId, pagina });

    return {
      itens: dados.Media.characters.edges.map(paraPersonagem),
      temMais: dados.Media.characters.pageInfo.hasNextPage,
    };
  },

  async personagem(id: number): Promise<PersonagemDetalhe> {
    const { Character: personagem } = await consultar<{
      Character: {
        id: number;
        name: { full: string; native: string | null };
        image: { large: string };
        description: string | null;
        gender: string | null;
        age: string | null;
        dateOfBirth: { day: number | null; month: number | null };
        favourites: number;
        media: { nodes: MidiaApi[] };
      };
    }>(CONSULTA_PERSONAGEM, { id });

    const { day: dia, month: mes } = personagem.dateOfBirth;

    return {
      id: personagem.id,
      nome: personagem.name.full,
      nomeNativo: personagem.name.native,
      imagem: personagem.image.large,
      descricao: limparTexto(personagem.description),
      idade: personagem.age,
      genero:
        personagem.gender === 'Female'
          ? 'Feminino'
          : personagem.gender === 'Male'
            ? 'Masculino'
            : personagem.gender,
      aniversario:
        dia && mes ? `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}` : null,
      favoritos: personagem.favourites,
      aparicoes: personagem.media.nodes.map(paraResumo),
    };
  },

  /** Episodios com exibicao prevista entre dois instantes, em milissegundos. */
  async lancamentos(inicio: number, fim: number): Promise<Lancamento[]> {
    const dados = await consultar<
      PaginaApi<{
        airingSchedules: {
          id: number;
          episode: number;
          airingAt: number;
          media: MidiaApi & { isAdult: boolean; popularity: number };
        }[];
      }>
    >(CONSULTA_GRADE, {
      inicio: Math.floor(inicio / 1000),
      fim: Math.floor(fim / 1000),
    });

    return dados.Page.airingSchedules
      .filter((item) => !item.media.isAdult && item.media.popularity >= POPULARIDADE_MINIMA_GRADE)
      .map((item) => ({
        id: item.id,
        episodio: item.episode,
        horario: item.airingAt * 1000,
        anime: paraResumo(item.media),
      }));
  },
};
