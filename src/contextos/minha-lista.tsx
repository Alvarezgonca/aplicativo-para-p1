import NetInfo from '@react-native-community/netinfo';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useSessao } from '@/contextos/sessao';
import { baixarSincronizado, enfileirar, enviarPendentes } from '@/services/sincronizacao';
import { storage } from '@/services/storage';
import type { AnimeResumo } from '@/services/tipos';

/** Um titulo salvo, com o momento em que entrou na lista. */
export interface ItemLista extends AnimeResumo {
  salvoEm: number;
}

interface ValorContexto {
  /** Titulos salvos, do mais recente para o mais antigo. */
  itens: ItemLista[];
  /** Falso enquanto a lista gravada ainda esta sendo lida do aparelho. */
  carregado: boolean;
  estaSalvo: (id: number) => boolean;
  alternar: (anime: AnimeResumo) => void;
  remover: (id: number) => void;
}

const Contexto = createContext<ValorContexto | undefined>(undefined);

/**
 * Inicio da chave no armazenamento local. O id do usuario e acrescentado no
 * fim, entao cada conta que entra neste aparelho tem a propria lista.
 */
const CHAVE = 'minha-lista';

/** Item como a API devolve: o id do anime vem como animeId e a data em ISO. */
interface ItemDaApi extends Omit<ItemLista, 'id' | 'salvoEm'> {
  animeId: number;
  salvoEm: string;
}

function daApi({ animeId, salvoEm, ...resto }: ItemDaApi): ItemLista {
  return { ...resto, id: animeId, salvoEm: Date.parse(salvoEm) };
}

/**
 * Copia so os campos do resumo. A tela de detalhe entrega um AnimeDetalhe,
 * com episodios, personagens e recomendacoes; gravar tudo isso encheria o
 * armazenamento sem necessidade, ja que a lista so mostra o cartaz.
 */
function resumir(anime: AnimeResumo): AnimeResumo {
  return {
    id: anime.id,
    titulo: anime.titulo,
    tituloRomaji: anime.tituloRomaji,
    tituloNativo: anime.tituloNativo,
    capa: anime.capa,
    capaGrande: anime.capaGrande,
    capaPequena: anime.capaPequena,
    banner: anime.banner,
    cor: anime.cor,
    nota: anime.nota,
    generos: anime.generos,
    ano: anime.ano,
    totalEpisodios: anime.totalEpisodios,
    formato: anime.formato,
  };
}

/**
 * Guarda a lista de animes salvos e a mantem entre aberturas do aplicativo.
 *
 * O botao de salvar fica no detalhe e a exibicao na aba Minha lista. Como sao
 * telas diferentes, o estado vive aqui, acima de ambas na arvore, e chega a
 * elas pelo contexto. O estado em memoria e a copia de trabalho; o
 * AsyncStorage e a copia que sobrevive ao fechamento do aplicativo.
 *
 * Os dados do anime sao gravados junto com o identificador, e nao so o
 * identificador: assim a lista abre na hora e funciona mesmo sem internet.
 *
 * A lista pertence ao usuario logado. Quando a sessao muda (entrar, sair ou
 * trocar de conta), a chave muda e a lista do novo dono e lida do disco.
 *
 * O aparelho guarda a copia de trabalho e a conta, no servidor, guarda a
 * copia oficial. Salvar ou remover muda a tela na hora e entra na fila de
 * sincronizacao (PUT ou DELETE em /lista/:animeId); ao entrar na conta e
 * quando a conexao volta, a lista do servidor substitui a do aparelho.
 */
export function ProvedorMinhaLista({ children }: { children: ReactNode }) {
  const { usuario } = useSessao();
  const chave = usuario ? `${CHAVE}:${usuario.id}` : null;

  // O estado guarda de qual chave veio a lista: enquanto a lista do novo
  // dono nao chega, a do dono anterior nao e exibida.
  const [estado, setEstado] = useState<{ chave: string | null; itens: ItemLista[] }>({
    chave: null,
    itens: [],
  });

  const dono = usuario?.id ?? null;
  // Muda quando a conexao volta, para sincronizar de novo.
  const [rodada, setRodada] = useState(0);

  useEffect(() => {
    let estavaOffline = false;
    return NetInfo.addEventListener((rede) => {
      const online = rede.isConnected !== false;
      if (online && estavaOffline) {
        setRodada((atual) => atual + 1);
      }
      estavaOffline = !online;
    });
  }, []);

  useEffect(() => {
    if (!chave || !dono) {
      return;
    }
    let ativo = true;
    storage
      .get<ItemLista[]>(chave, [])
      .then((lidos) => {
        if (ativo) {
          // O conteudo vem do disco e pode estar num formato antigo.
          const validos = Array.isArray(lidos)
            ? lidos.filter((item) => typeof item?.id === 'number')
            : [];
          setEstado({ chave, itens: validos });
        }
        return baixarSincronizado<ItemDaApi[]>(dono, '/lista');
      })
      .then((doServidor) => {
        if (ativo && doServidor) {
          const itens = doServidor.map(daApi);
          setEstado({ chave, itens });
          storage.set(chave, itens);
        }
      });
    // Se a sessao mudar antes da leitura terminar, a resposta antiga e ignorada.
    return () => {
      ativo = false;
    };
  }, [chave, dono, rodada]);

  const carregado = chave === null || estado.chave === chave;
  const itens = useMemo(
    () => (chave !== null && estado.chave === chave ? estado.itens : []),
    [chave, estado],
  );

  /** Atualiza a memoria e grava a nova lista no aparelho. */
  const salvarLista = useCallback(
    (novos: ItemLista[]) => {
      if (!chave) {
        return;
      }
      setEstado({ chave, itens: novos });
      storage.set(chave, novos);
    },
    [chave],
  );

  /** Manda a mudanca para a fila e tenta enviar na hora. */
  const sincronizar = useCallback(
    (id: number, item: ItemLista | null) => {
      if (!dono) {
        return;
      }
      const operacao = item
        ? {
            chave: `lista:${id}`,
            metodo: 'PUT' as const,
            caminho: `/lista/${id}`,
            corpo: { ...item, id: undefined },
          }
        : { chave: `lista:${id}`, metodo: 'DELETE' as const, caminho: `/lista/${id}` };
      enfileirar(dono, operacao).then(() => enviarPendentes(dono));
    },
    [dono],
  );

  const alternar = useCallback(
    (anime: AnimeResumo) => {
      if (!carregado) {
        return;
      }
      const jaSalvo = itens.some((item) => item.id === anime.id);
      if (jaSalvo) {
        salvarLista(itens.filter((item) => item.id !== anime.id));
        sincronizar(anime.id, null);
        return;
      }
      const novo = { ...resumir(anime), salvoEm: Date.now() };
      salvarLista([novo, ...itens]);
      sincronizar(anime.id, novo);
    },
    [itens, carregado, salvarLista, sincronizar],
  );

  const remover = useCallback(
    (id: number) => {
      salvarLista(itens.filter((item) => item.id !== id));
      sincronizar(id, null);
    },
    [itens, salvarLista, sincronizar],
  );

  const valor = useMemo<ValorContexto>(
    () => ({
      itens,
      carregado,
      estaSalvo: (id: number) => itens.some((item) => item.id === id),
      alternar,
      remover,
    }),
    [itens, carregado, alternar, remover],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/**
 * Acessa a lista salva. Lanca erro quando usado fora do provedor, de modo que
 * o problema apareca na montagem e nao como um valor indefinido silencioso.
 */
export function useMinhaLista(): ValorContexto {
  const valor = useContext(Contexto);
  if (!valor) {
    throw new Error('useMinhaLista precisa estar dentro de ProvedorMinhaLista.');
  }
  return valor;
}
