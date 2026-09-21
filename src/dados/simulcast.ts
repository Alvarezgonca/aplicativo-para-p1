import { Anime, buscarAnimePorId } from './animes';

export interface LancamentoSimulcast {
  animeId: number;
  /** Episodio que estreia no dia. */
  episodio: number;
  /** Horario de exibicao no fuso de Brasilia. */
  horario: string;
  /** Marca episodios que ainda nao foram liberados. */
  aguardando: boolean;
}

export interface DiaSimulcast {
  /** Rotulo do dia da semana, usado como cabecalho de secao. */
  dia: string;
  lancamentos: LancamentoSimulcast[];
}

/**
 * Grade semanal de lancamentos, no formato consumido pela SectionList da tela
 * de simulcast. Cada dia e uma secao e cada lancamento uma linha.
 */
export const gradeSimulcast: DiaSimulcast[] = [
  {
    dia: 'Segunda-feira',
    lancamentos: [
      { animeId: 11, episodio: 19, horario: '13:30', aguardando: false },
      { animeId: 17, episodio: 8, horario: '16:00', aguardando: true },
    ],
  },
  {
    dia: 'Terca-feira',
    lancamentos: [
      { animeId: 14, episodio: 11, horario: '12:00', aguardando: false },
      { animeId: 10, episodio: 23, horario: '15:30', aguardando: true },
    ],
  },
  {
    dia: 'Quarta-feira',
    lancamentos: [{ animeId: 13, episodio: 9, horario: '14:00', aguardando: false }],
  },
  {
    dia: 'Quinta-feira',
    lancamentos: [
      { animeId: 9, episodio: 7, horario: '13:00', aguardando: false },
      { animeId: 20, episodio: 14, horario: '17:00', aguardando: true },
    ],
  },
  {
    dia: 'Sexta-feira',
    lancamentos: [
      { animeId: 3, episodio: 12, horario: '12:30', aguardando: false },
      { animeId: 2, episodio: 21, horario: '14:30', aguardando: false },
    ],
  },
  {
    dia: 'Sabado',
    lancamentos: [
      { animeId: 1, episodio: 28, horario: '11:00', aguardando: false },
      { animeId: 4, episodio: 6, horario: '16:30', aguardando: true },
    ],
  },
  {
    dia: 'Domingo',
    lancamentos: [
      { animeId: 6, episodio: 17, horario: '10:30', aguardando: false },
      { animeId: 5, episodio: 13, horario: '15:00', aguardando: true },
      { animeId: 19, episodio: 25, horario: '18:00', aguardando: true },
    ],
  },
];

/** Recupera o anime de um lancamento da grade. */
export function animeDoLancamento(lancamento: LancamentoSimulcast): Anime | undefined {
  return buscarAnimePorId(lancamento.animeId);
}
