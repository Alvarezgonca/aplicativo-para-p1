import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Acesso tipado ao AsyncStorage.
 *
 * O AsyncStorage so guarda texto. Este modulo faz o JSON.stringify na escrita
 * e o JSON.parse na leitura, para que o resto do aplicativo trabalhe com
 * objetos. O AsyncStorage nao e criptografado: aqui ficam preferencias, lista
 * salva, historico e cache. Token de acesso vai para o SecureStore.
 *
 * Todas as chaves recebem o prefixo abaixo. A versao no prefixo permite mudar
 * o formato dos dados no futuro sem ler por engano o que uma versao anterior
 * do aplicativo gravou.
 */
export const PREFIXO = 'app:v1:';

export interface ItemGuardado {
  chave: string;
  /** Tamanho aproximado do valor gravado, em bytes. */
  bytes: number;
}

export const storage = {
  /**
   * Le um valor. Devolve o padrao quando a chave nao existe ou quando o
   * conteudo esta corrompido, ja que o JSON.parse lanca erro com texto
   * invalido.
   */
  async get<T>(chave: string, padrao: T): Promise<T> {
    try {
      const bruto = await AsyncStorage.getItem(PREFIXO + chave);
      return bruto ? (JSON.parse(bruto) as T) : padrao;
    } catch {
      return padrao;
    }
  },

  async set<T>(chave: string, valor: T): Promise<void> {
    await AsyncStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  },

  async remove(chave: string): Promise<void> {
    await AsyncStorage.removeItem(PREFIXO + chave);
  },

  /** Lista as chaves deste aplicativo com o tamanho de cada valor. */
  async listar(): Promise<ItemGuardado[]> {
    const chaves = (await AsyncStorage.getAllKeys()).filter((chave) => chave.startsWith(PREFIXO));
    const pares = await AsyncStorage.multiGet(chaves);

    return pares
      .map(([chave, valor]) => ({ chave: chave.slice(PREFIXO.length), bytes: valor?.length ?? 0 }))
      .sort((a, b) => a.chave.localeCompare(b.chave));
  },

  /** Apaga de uma vez todas as chaves que comecam com o trecho informado. */
  async removerPorPrefixo(inicio: string): Promise<number> {
    const chaves = (await AsyncStorage.getAllKeys()).filter((chave) =>
      chave.startsWith(PREFIXO + inicio),
    );
    await AsyncStorage.multiRemove(chaves);
    return chaves.length;
  },
};
