import { Anime, buscarAnimePorId } from './animes';

export interface Episodio {
  id: string;
  animeId: number;
  numero: number;
  titulo: string;
  /** Duracao em minutos. */
  duracao: number;
  /** Fracao ja assistida, de 0 a 1. Zero significa episodio nao iniciado. */
  progresso: number;
  /** Miniatura horizontal exibida na lista. */
  miniatura: string;
  /** Episodios marcados como premium exigem assinatura no aplicativo real. */
  premium: boolean;
}

/**
 * Titulos de episodio dos primeiros arcos, usados quando disponiveis. Para os
 * demais episodios a lista cai no rotulo numerico padrao.
 */
const titulosPorAnime: Record<number, string[]> = {
  1: ['A jornada chegou ao fim', 'O mago que nao envelhece', 'Assassina de mana', 'O desejo do heroi'],
  2: ['Ryomen Sukuna', 'Para mim mesmo', 'Garota de aco', 'Nascido idiota'],
  3: ['Eu sozinho subo de nivel', 'Se eu tivesse mais uma chance', 'A masmorra dupla'],
  4: ['Cachorro e motosserra', 'O lugar onde Makima esta', 'Chegada em Kyoto'],
  5: ['Operacao Strix', 'Consiga uma esposa', 'Prepare-se para a entrevista'],
  6: ['Crueldade', 'Treinador Sakonji Urokodaki', 'Sabito e Makomo'],
};

/**
 * Monta a lista de episodios de um anime a partir dos dados do catalogo.
 *
 * O progresso e derivado do identificador do anime para que a interface exiba
 * barras de continuidade estaveis a cada abertura, sem depender de sorteio.
 */
export function listarEpisodios(animeId: number): Episodio[] {
  const anime = buscarAnimePorId(animeId);
  if (!anime) {
    return [];
  }

  const titulos = titulosPorAnime[animeId] ?? [];
  const assistidosAte = anime.destaque ? 3 : 0;

  return Array.from({ length: anime.totalEpisodios }, (_, indice) => {
    const numero = indice + 1;
    return {
      id: `${animeId}-${numero}`,
      animeId,
      numero,
      titulo: titulos[indice] ?? `Episodio ${numero}`,
      duracao: anime.duracaoMedia,
      progresso: numero < assistidosAte ? 1 : numero === assistidosAte ? 0.45 : 0,
      miniatura: anime.banner,
      premium: numero > 3,
    };
  });
}

/**
 * Fracao da serie ja concluida, de 0 a 1. Usada pela barra de progresso dos
 * cartazes na grade da lista salva.
 */
export function progressoDaSerie(anime: Anime): number {
  const episodios = listarEpisodios(anime.id);
  if (episodios.length === 0) {
    return 0;
  }
  const concluidos = episodios.filter((episodio) => episodio.progresso >= 1).length;
  return concluidos / episodios.length;
}

/** Primeiro episodio ainda nao concluido, usado pelo botao de continuar. */
export function proximoEpisodio(anime: Anime): Episodio | undefined {
  return listarEpisodios(anime.id).find((episodio) => episodio.progresso < 1);
}
