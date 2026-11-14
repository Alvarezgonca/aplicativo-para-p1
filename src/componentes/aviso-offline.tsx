import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useConexao } from '@/hooks/use-conexao';

/**
 * Faixa exibida no topo de todas as telas enquanto o aparelho esta sem rede.
 *
 * Fica no layout raiz, por cima da navegacao. pointerEvents="none" deixa os
 * toques passarem para a tela de baixo, para o aviso nunca bloquear o uso.
 */
export function AvisoOffline() {
  const online = useConexao();
  const recuo = useSafeAreaInsets();

  if (online) {
    return null;
  }

  return (
    <View style={[styles.faixa, { top: recuo.top + Espacamento.xs }]} pointerEvents="none">
      <Ionicons name="cloud-offline" size={14} color={Cores.texto} />
      <Text style={styles.texto}>Você está offline. Mostrando o que foi salvo no aparelho.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    position: 'absolute',
    left: Espacamento.lg,
    right: Espacamento.lg,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    paddingVertical: Espacamento.sm,
    paddingHorizontal: Espacamento.md,
    borderRadius: Raio.md,
    backgroundColor: Cores.erro,
    // Sombra nas duas plataformas: shadow* vale no iOS, elevation no Android.
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  texto: { flex: 1, color: Cores.texto, fontSize: Fonte.minuscula, fontWeight: '700' },
});
