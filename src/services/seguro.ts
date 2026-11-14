import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Armazenamento de segredos (por enquanto, so o token de acesso).
 *
 * No Android e no iOS o SecureStore grava no cofre do sistema (Keystore e
 * Keychain), criptografado e preso a este aplicativo. O AsyncStorage, ao
 * contrario, e texto puro e poderia ser lido em um aparelho com root ou em um
 * backup. Por isso dados de sessao ficam separados: o perfil do usuario vai
 * para o AsyncStorage e o token, para ca.
 *
 * O SecureStore so aceita letras, numeros, ponto, hifen e sublinhado na chave,
 * entao o prefixo usa ponto em vez dos dois-pontos do storage comum.
 */
const PREFIXO = 'app.v1.';

/**
 * O navegador nao tem cofre equivalente e o SecureStore nao funciona na web.
 * Nela o token cai no AsyncStorage, que la vira o localStorage: serve para
 * testar o aplicativo no navegador, mas nao tem a mesma protecao do celular.
 */
const semCofre = Platform.OS === 'web';

export const seguro = {
  async get(chave: string): Promise<string | null> {
    try {
      if (semCofre) {
        return await AsyncStorage.getItem(PREFIXO + chave);
      }
      return await SecureStore.getItemAsync(PREFIXO + chave);
    } catch {
      return null;
    }
  },

  async set(chave: string, valor: string): Promise<void> {
    if (semCofre) {
      await AsyncStorage.setItem(PREFIXO + chave, valor);
      return;
    }
    await SecureStore.setItemAsync(PREFIXO + chave, valor);
  },

  async remove(chave: string): Promise<void> {
    try {
      if (semCofre) {
        await AsyncStorage.removeItem(PREFIXO + chave);
        return;
      }
      await SecureStore.deleteItemAsync(PREFIXO + chave);
    } catch {
      // Nada a remover.
    }
  },
};
