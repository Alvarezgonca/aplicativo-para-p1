/**
 * Catalogo de animes do aplicativo.
 *
 * Todo o conteudo e estatico: o aplicativo nao consulta nenhum servico externo
 * em tempo de execucao. Os campos de imagem guardam apenas o endereco publico
 * da capa e do banner, carregados pelo componente Image do React Native.
 */

export interface Anime {
  id: number;
  /** Titulo de exibicao, em ingles quando disponivel. */
  titulo: string;
  /** Titulo original transliterado, mostrado na tela de detalhe. */
  tituloOriginal: string;
  sinopse: string;
  /** Poster vertical, usado nos carrosseis e na grade da lista. */
  capa: string;
  /** Imagem horizontal, usada no destaque da tela inicial e no cabecalho. */
  banner: string;
  /** Nota de 0 a 10. */
  nota: number;
  totalEpisodios: number;
  /** Duracao media de cada episodio, em minutos. */
  duracaoMedia: number;
  ano: number;
  estudio: string;
  generos: string[];
  /** Indica se ha dublagem em portugues disponivel. */
  dublado: boolean;
  /** Marca os titulos elegiveis ao banner rotativo da tela inicial. */
  destaque: boolean;
}

export const animes: Anime[] = [
  {
    id: 1,
    titulo: 'Frieren: Beyond Journey’s End',
    tituloOriginal: 'Sousou no Frieren',
    sinopse:
      'A elfa Frieren derrotou o Rei Demônio ao lado de seus companheiros e trouxe paz ao reino. Décadas depois, o funeral de um deles a faz perceber que mal conheceu as pessoas com quem viajou. Movida por essa falta, ela parte em uma nova jornada para entender o que significa uma vida humana.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg',
    nota: 9.1,
    totalEpisodios: 28,
    duracaoMedia: 24,
    ano: 2023,
    estudio: 'MADHOUSE',
    generos: ['Aventura', 'Drama', 'Fantasia'],
    dublado: true,
    destaque: true,
  },
  {
    id: 2,
    titulo: 'JUJUTSU KAISEN',
    tituloOriginal: 'Jujutsu Kaisen',
    sinopse:
      'Para salvar os amigos, o estudante Yuji Itadori engole um dedo amaldiçoado e passa a dividir o corpo com Ryomen Sukuna, o Rei das Maldições. Condenado à execução, ganha uma sobrevida para encontrar os vinte dedos restantes e é matriculado na Escola Técnica de Jujutsu de Tóquio.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg',
    nota: 8.4,
    totalEpisodios: 24,
    duracaoMedia: 24,
    ano: 2020,
    estudio: 'MAPPA',
    generos: ['Ação', 'Drama', 'Sobrenatural'],
    dublado: true,
    destaque: true,
  },
  {
    id: 3,
    titulo: 'Solo Leveling',
    tituloOriginal: 'Ore dake Level Up na Ken',
    sinopse:
      'Em um mundo onde portais ligam a Terra a masmorras, Sung Jinwoo é conhecido como o caçador mais fraco da humanidade. Depois de sobreviver por pouco a uma masmorra dupla, ele recebe um sistema misterioso que só ele enxerga e que lhe permite ficar mais forte sem limite.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-37yfQA3ym8PA.jpg',
    nota: 8.0,
    totalEpisodios: 12,
    duracaoMedia: 24,
    ano: 2024,
    estudio: 'A-1 Pictures',
    generos: ['Ação', 'Aventura', 'Fantasia'],
    dublado: true,
    destaque: true,
  },
  {
    id: 4,
    titulo: 'Chainsaw Man',
    tituloOriginal: 'Chainsaw Man',
    sinopse:
      'Denji vive na miséria pagando a dívida do pai e caçando demônios com a ajuda de Pochita, seu cão-motosserra. Traído e morto, ele volta à vida fundido a Pochita e passa a trabalhar como Caçador de Demônios oficial em troca de uma vida minimamente normal.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-DdP4vAdssLoz.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/127230-o8IRwCGVr9KW.jpg',
    nota: 8.3,
    totalEpisodios: 12,
    duracaoMedia: 25,
    ano: 2022,
    estudio: 'MAPPA',
    generos: ['Ação', 'Drama', 'Terror', 'Sobrenatural'],
    dublado: true,
    destaque: false,
  },
  {
    id: 5,
    titulo: 'SPY x FAMILY',
    tituloOriginal: 'SPY×FAMILY',
    sinopse:
      'O espião conhecido como Twilight precisa montar uma família de fachada para se aproximar de um político inacessível. Sem saber, ele adota uma menina que lê mentes e se casa com uma assassina profissional. Nenhum dos três conhece o segredo dos outros.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Kb6R5nYQfjmP.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/140960-Z7xSvkRxHKfj.jpg',
    nota: 8.3,
    totalEpisodios: 12,
    duracaoMedia: 24,
    ano: 2022,
    estudio: 'CloverWorks',
    generos: ['Ação', 'Comédia', 'Cotidiano', 'Sobrenatural'],
    dublado: true,
    destaque: false,
  },
  {
    id: 6,
    titulo: 'Demon Slayer: Kimetsu no Yaiba',
    tituloOriginal: 'Kimetsu no Yaiba',
    sinopse:
      'Tanjiro Kamado volta para casa e encontra a família assassinada por um demônio. A única sobrevivente, sua irmã Nezuko, foi transformada. Ele entra para os Caçadores de Demônios em busca de uma cura para ela e de vingança contra o responsável.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg',
    nota: 8.2,
    totalEpisodios: 26,
    duracaoMedia: 24,
    ano: 2019,
    estudio: 'ufotable',
    generos: ['Ação', 'Aventura', 'Drama', 'Fantasia', 'Sobrenatural'],
    dublado: true,
    destaque: false,
  },
  {
    id: 7,
    titulo: 'BOCCHI THE ROCK!',
    tituloOriginal: 'Bocchi the Rock!',
    sinopse:
      'Hitori Gotoh toca guitarra sozinha no quarto há anos e sonha com uma banda, mas sua timidez extrema a impede de falar com qualquer pessoa. Tudo muda quando uma baterista a recruta às pressas para um show que acontece naquela mesma noite.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130003-HTDmeL4RGeJ4.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/130003-5F90a7BtsPQN.jpg',
    nota: 8.7,
    totalEpisodios: 12,
    duracaoMedia: 24,
    ano: 2022,
    estudio: 'CloverWorks',
    generos: ['Comédia', 'Música', 'Cotidiano'],
    dublado: false,
    destaque: false,
  },
  {
    id: 8,
    titulo: 'OSHI NO KO',
    tituloOriginal: '[Oshi no Ko]',
    sinopse:
      'Um médico do interior e fã de idols descobre que sua artista favorita está grávida e escondida. Após um crime brutal, ele renasce como filho dela e cresce por dentro da indústria do entretenimento, disposto a descobrir a verdade por trás do que aconteceu.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx150672-WqmmwZ4nMzAy.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/150672-ISwoA0eS722H.jpg',
    nota: 8.4,
    totalEpisodios: 11,
    duracaoMedia: 24,
    ano: 2023,
    estudio: 'Doga Kobo',
    generos: ['Drama', 'Mistério', 'Psicológico', 'Sobrenatural'],
    dublado: false,
    destaque: false,
  },
  {
    id: 9,
    titulo: 'DAN DA DAN',
    tituloOriginal: 'Dandadan',
    sinopse:
      'Momo acredita em fantasmas e Okarun acredita em alienígenas. Para provar quem está certo, cada um visita o lugar amaldiçoado do outro e descobre que ambos existem. A discussão vira uma parceria improvável contra seres sobrenaturais e extraterrestres.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-60q1B6GK2Ghb.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/171018-SpwPNAduszXl.jpg',
    nota: 8.3,
    totalEpisodios: 12,
    duracaoMedia: 24,
    ano: 2024,
    estudio: 'Science SARU',
    generos: ['Ação', 'Comédia', 'Drama', 'Romance', 'Ficção Científica', 'Sobrenatural'],
    dublado: true,
    destaque: true,
  },
  {
    id: 10,
    titulo: 'BLUE LOCK',
    tituloOriginal: 'Blue Lock',
    sinopse:
      'Após mais uma eliminação precoce em Copa do Mundo, a federação japonesa cria o Blue Lock: um confinamento que reúne trezentos atacantes jovens para forjar, na base da eliminação, o atacante mais egoísta e letal do mundo.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx137822-U8naszP96vzC.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/137822-oevspckMGLuY.jpg',
    nota: 7.9,
    totalEpisodios: 24,
    duracaoMedia: 25,
    ano: 2022,
    estudio: '8-bit',
    generos: ['Ação', 'Drama', 'Esportes'],
    dublado: true,
    destaque: false,
  },
  {
    id: 11,
    titulo: 'The Apothecary Diaries',
    tituloOriginal: 'Kusuriya no Hitorigoto',
    sinopse:
      'Maomao é uma boticária criada no distrito do prazer, sequestrada e vendida como serva no palácio imperial. Seu conhecimento de venenos e remédios chama a atenção da corte, e ela acaba investigando as intrigas e envenenamentos do harém.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx161645-QLbzHXiYRgV2.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/161645-oqzTZYIvviWI.jpg',
    nota: 8.8,
    totalEpisodios: 24,
    duracaoMedia: 23,
    ano: 2023,
    estudio: 'OLM',
    generos: ['Drama', 'Mistério'],
    dublado: true,
    destaque: false,
  },
  {
    id: 12,
    titulo: 'Vinland Saga',
    tituloOriginal: 'VINLAND SAGA',
    sinopse:
      'Thorfinn cresce entre vikings vendo o assassino de seu pai como mentor e inimigo, esperando o dia do duelo de vingança. A guerra pela Inglaterra o arrasta por anos até que ele precise decidir se existe algum sentido em uma vida construída sobre matar.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-2fhDFPCuMNiz.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101348-pivKKffCAwAY.jpg',
    nota: 8.7,
    totalEpisodios: 24,
    duracaoMedia: 24,
    ano: 2019,
    estudio: 'WIT STUDIO',
    generos: ['Ação', 'Aventura', 'Drama'],
    dublado: false,
    destaque: false,
  },
  {
    id: 13,
    titulo: 'Kaiju No. 8',
    tituloOriginal: 'Kaijuu 8-gou',
    sinopse:
      'Kafka Hibino limpa os restos dos monstros que a Força de Defesa abate e desistiu de entrar para a corporação. Quando uma criatura estranha entra em seu corpo e o transforma em um kaiju, ele ganha uma última chance de cumprir a promessa de infância.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153288-25FBfFJzEQ5O.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/153288-JNsWuMPMAuJL.jpg',
    nota: 8.1,
    totalEpisodios: 12,
    duracaoMedia: 24,
    ano: 2024,
    estudio: 'Production I.G',
    generos: ['Ação', 'Ficção Científica'],
    dublado: true,
    destaque: false,
  },
  {
    id: 14,
    titulo: 'WIND BREAKER',
    tituloOriginal: 'WIND BREAKER',
    sinopse:
      'Haruka Sakura chega à Escola Furin decidido a se tornar o mais forte do lugar e desprezando quem depende dos outros. Descobre que a escola, famosa pelas brigas, é na verdade a guardiã da cidade contra quem ameaça os moradores.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163270-wboZJp0ybwVK.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/163270-fcjrqp3iKWdb.jpg',
    nota: 7.7,
    totalEpisodios: 13,
    duracaoMedia: 24,
    ano: 2024,
    estudio: 'CloverWorks',
    generos: ['Ação', 'Comédia', 'Drama'],
    dublado: false,
    destaque: false,
  },
  {
    id: 15,
    titulo: 'Cyberpunk: Edgerunners',
    tituloOriginal: 'Cyberpunk: Edgerunners',
    sinopse:
      'Em Night City, David Martinez perde tudo e decide sobreviver como edgerunner, um mercenário fora da lei. Implantes militares proibidos lhe dão velocidade sobre-humana, mas cada aprimoramento o aproxima do colapso mental.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-ayZPoxiWt4Li.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/120377-c15oLS8CA31s.jpg',
    nota: 8.5,
    totalEpisodios: 10,
    duracaoMedia: 24,
    ano: 2022,
    estudio: 'TRIGGER',
    generos: ['Ação', 'Drama', 'Psicológico', 'Ficção Científica'],
    dublado: false,
    destaque: false,
  },
  {
    id: 16,
    titulo: 'HAIKYU!!',
    tituloOriginal: 'Haikyuu!!',
    sinopse:
      'Baixo e obstinado, Shoyo Hinata entra para o time de vôlei do colégio Karasuno e reencontra Tobio Kageyama, o armador genial que o humilhou no fundamental. Obrigados a jogar juntos, os dois transformam rivalidade em uma dupla imprevisível.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20464-ooZUyBe4ptp9.png',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20464-PpYjO9cPN1gs.jpg',
    nota: 8.3,
    totalEpisodios: 25,
    duracaoMedia: 24,
    ano: 2014,
    estudio: 'Production I.G',
    generos: ['Comédia', 'Drama', 'Esportes'],
    dublado: true,
    destaque: false,
  },
  {
    id: 17,
    titulo: 'Mob Psycho 100',
    tituloOriginal: 'Mob Psycho 100',
    sinopse:
      'Shigeo Kageyama é um estudante apagado que carrega poderes psíquicos enormes e teme usá-los. Trabalhando para um vidente charlatão, ele tenta crescer como pessoa enquanto sua emoção reprimida se acumula rumo aos cem por cento.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21507-6YUSbh2m0N1p.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21507-Qx8bGsLXUgLo.jpg',
    nota: 8.4,
    totalEpisodios: 12,
    duracaoMedia: 24,
    ano: 2016,
    estudio: 'bones',
    generos: ['Ação', 'Comédia', 'Drama', 'Psicológico', 'Cotidiano', 'Sobrenatural'],
    dublado: false,
    destaque: false,
  },
  {
    id: 18,
    titulo: 'Made in Abyss',
    tituloOriginal: 'Made in Abyss',
    sinopse:
      'Uma fossa colossal e inexplorada guarda relíquias e criaturas em suas profundezas, e quem sobe de volta paga um preço no próprio corpo. Riko desce em busca da mãe desaparecida acompanhada de Reg, um menino robô sem memória.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97986-TQ7dCgbS3y5s.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/97986-C55UnbJKB7ZF.jpg',
    nota: 8.4,
    totalEpisodios: 13,
    duracaoMedia: 25,
    ano: 2017,
    estudio: 'Kinema Citrus',
    generos: ['Aventura', 'Drama', 'Fantasia', 'Terror', 'Mistério', 'Ficção Científica'],
    dublado: false,
    destaque: false,
  },
  {
    id: 19,
    titulo: 'My Hero Academia',
    tituloOriginal: 'Boku no Hero Academia',
    sinopse:
      'Em um mundo onde quase todos nascem com superpoderes, Izuku Midoriya não tem nenhum e ainda assim quer ser herói. Um encontro com o maior herói do mundo lhe dá a chance de herdar um poder e entrar na academia U.A.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21459-nYh85uj2Fuwr.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21459-yeVkolGKdGUV.jpg',
    nota: 7.6,
    totalEpisodios: 13,
    duracaoMedia: 24,
    ano: 2016,
    estudio: 'bones',
    generos: ['Ação', 'Aventura', 'Comédia'],
    dublado: true,
    destaque: false,
  },
  {
    id: 20,
    titulo: 'Re:ZERO -Starting Life in Another World-',
    tituloOriginal: 'Re:Zero kara Hajimeru Isekai Seikatsu',
    sinopse:
      'Subaru Natsuki é transportado para um mundo de fantasia sem nenhuma habilidade especial, exceto uma: ao morrer, ele retorna a um ponto anterior no tempo. Cada falha custa a ele a lembrança de sofrimentos que ninguém mais viveu.',
    capa: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21355-wRVUrGxpvIQQ.jpg',
    banner: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21355-f9SjOfEJMk5P.jpg',
    nota: 8.1,
    totalEpisodios: 25,
    duracaoMedia: 25,
    ano: 2016,
    estudio: 'WHITE FOX',
    generos: ['Ação', 'Aventura', 'Drama', 'Fantasia', 'Psicológico', 'Romance', 'Suspense'],
    dublado: false,
    destaque: false,
  },
];

/** Busca um anime pelo identificador. Retorna undefined se nao existir. */
export function buscarAnimePorId(id: number): Anime | undefined {
  return animes.find((anime) => anime.id === id);
}

/** Titulos elegiveis ao banner rotativo da tela inicial. */
export const animesEmDestaque = animes.filter((anime) => anime.destaque);
