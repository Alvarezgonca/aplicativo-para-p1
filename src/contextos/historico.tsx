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

/** Um episodio assistido (inteiro ou em parte). */
export interface RegistroHistorico {
  animeId: number;
  titulo: string;
  capa: string;
  banner: string | null;
  episodio: number;
  tituloEpisodio: string;
  miniatura: string | null;
  /** Duracao do episodio em minutos. */
  duracao: number;
  /** Fracao assistida, de 0 a 1. */
  progresso: number;
  /** Ultima vez que o episodio foi reproduzido, em milissegundos. */
  assistidoEm: number;
}

/** A partir desta fracao o episodio conta como assistido. */
export const FRACAO_CONCLUIDO = 0.95;

/** Limite de registros guardados, para o historico nao crescer sem fim. */
const LIMITE = 200;

const CHAVE = 'historico';

/** Registro como a API devolve: a data vem em texto ISO. */
interface RegistroDaApi extends Omit<RegistroHistorico, 'assistidoEm'> {
  assistidoEm: string;
}

function daApi(registro: RegistroDaApi): RegistroHistorico {
  return { ...registro, assistidoEm: Date.parse(registro.assistidoEm) };
}

interface ValorContexto {
  /** Registros do mais recente para o mais antigo. */
  registros: RegistroHistorico[];
  carregado: boolean;
  /** Fracao ja assistida de um episodio (0 quando nunca foi aberto). */
  progressoDe: (animeId: number, episodio: number) => number;
  registrar: (registro: Omit<RegistroHistorico, 'assistidoEm'>) => void;
  limpar: () => void;
}

const Contexto = createContext<ValorContexto | undefined>(undefined);

/**
 * Historico de reproducao, guardado no aparelho e na conta.
 *
 * O player chama registrar enquanto o episodio toca; a tela inicial usa os
 * registros para a fileira "Continuar assistindo", o detalhe para as barras de
 * progresso dos episodios e o perfil para as estatisticas.
 *
 * Como a lista, o historico e de cada usuario: a chave leva o id da conta.
 * A copia do aparelho abre na hora e funciona sem internet; cada mudanca
 * entra na fila de sincronizacao e vai para a API. Ao entrar na conta e
 * quando a conexao volta, a versao do servidor substitui a local, entao o
 * progresso feito em outro celular aparece aqui.
 */
export function ProvedorHistorico({ children }: { children: ReactNode }) {
  const { usuario } = useSessao();
  const chave = usuario ? `${CHAVE}:${usuario.id}` : null;
  const [estado, setEstado] = useState<{
    chave: string | null;
    registros: RegistroHistorico[];
  }>({ chave: null, registros: [] });

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

  // Primeiro a copia local (instantanea), depois a do servidor.
  useEffect(() => {
    if (!chave || !dono) {
      return;
    }
    let ativo = true;
    storage
      .get<RegistroHistorico[]>(chave, [])
      .then((lidos) => {
        if (ativo) {
          setEstado({ chave, registros: Array.isArray(lidos) ? lidos : [] });
        }
        return baixarSincronizado<RegistroDaApi[]>(dono, '/historico');
      })
      .then((doServidor) => {
        if (ativo && doServidor) {
          const registros = doServidor.map(daApi);
          setEstado({ chave, registros });
          storage.set(chave, registros);
        }
      });
    return () => {
      ativo = false;
    };
  }, [chave, dono, rodada]);

  const carregado = chave === null || estado.chave === chave;
  const registros = useMemo(
    () => (chave !== null && estado.chave === chave ? estado.registros : []),
    [chave, estado],
  );

  /**
   * Coloca o registro no topo, substituindo o anterior do mesmo episodio.
   * A gravacao no disco acontece aqui, mas o player so chama esta funcao de
   * tempos em tempos (e ao sair), e nao a cada avancar da barra: gravar no
   * armazenamento a todo instante deixaria o aplicativo lento.
   */
  const registrar = useCallback(
    (dados: Omit<RegistroHistorico, 'assistidoEm'>) => {
      if (!chave || !dono) {
        return;
      }
      const novo: RegistroHistorico = { ...dados, assistidoEm: Date.now() };
      setEstado((atual) => {
        // Gravacao que chega depois de trocar de conta nao entra no historico novo.
        if (atual.chave !== chave) {
          return atual;
        }
        const outros = atual.registros.filter(
          (item) => !(item.animeId === novo.animeId && item.episodio === novo.episodio),
        );
        const atualizados = [novo, ...outros].slice(0, LIMITE);
        storage.set(chave, atualizados);
        return { chave, registros: atualizados };
      });

      const { animeId, episodio, ...corpo } = novo;
      enfileirar(dono, {
        chave: `historico:${animeId}:${episodio}`,
        metodo: 'PUT',
        caminho: `/historico/${animeId}/${episodio}`,
        corpo,
      }).then(() => enviarPendentes(dono));
    },
    [chave, dono],
  );

  const limpar = useCallback(() => {
    if (!chave || !dono) {
      return;
    }
    setEstado({ chave, registros: [] });
    storage.remove(chave);
    // Limpar torna inuteis os progressos que ainda nao tinham subido.
    enfileirar(
      dono,
      { chave: 'historico:limpar', metodo: 'DELETE', caminho: '/historico' },
      (pendente) => pendente.chave.startsWith('historico:'),
    ).then(() => enviarPendentes(dono));
  }, [chave, dono]);

  const valor = useMemo<ValorContexto>(
    () => ({
      registros,
      carregado,
      progressoDe: (animeId: number, episodio: number) =>
        registros.find((item) => item.animeId === animeId && item.episodio === episodio)
          ?.progresso ?? 0,
      registrar,
      limpar,
    }),
    [registros, carregado, registrar, limpar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useHistorico(): ValorContexto {
  const valor = useContext(Contexto);
  if (!valor) {
    throw new Error('useHistorico precisa estar dentro de ProvedorHistorico.');
  }
  return valor;
}
