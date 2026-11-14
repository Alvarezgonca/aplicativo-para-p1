import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BarraProgresso } from '@/componentes/barra-progresso';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import type { Episodio } from '@/services/tipos';

interface Props {
  episodio: Episodio;
  /** Duracao do episodio em minutos, quando conhecida. */
  duracao: number | null;
  /** Fracao ja assistida, de 0 a 1. */
  progresso?: number;
  aoPressionar: () => void;
}

/**
 * Uma linha da lista de episodios da tela de detalhe.
 *
 * A miniatura carrega o indicador de reproducao e, quando o episodio ja foi
 * iniciado, a barra de progresso rente a base.
 */
export function LinhaEpisodio({ episodio, duracao, progresso = 0, aoPressionar }: Props) {
  const concluido = progresso >= 0.95;

  return (
    <Pressable
      style={({ pressed }) => [styles.linha, pressed && styles.pressionada]}
      onPress={aoPressionar}>
      <View style={styles.moldura}>
        {episodio.miniatura ? (
          <Image
            source={episodio.miniatura}
            style={styles.imagem}
            contentFit="cover"
            transition={200}
          />
        ) : null}
        <View style={styles.sobreposicao}>
          <Ionicons name={concluido ? 'refresh' : 'play'} size={16} color={Cores.texto} />
        </View>
        {progresso > 0 ? (
          <View style={styles.progresso}>
            <BarraProgresso progresso={progresso} />
          </View>
        ) : null}
      </View>

      <View style={styles.informacoes}>
        <Text style={styles.numero}>Episódio {episodio.numero}</Text>
        <Text style={styles.titulo} numberOfLines={2}>
          {episodio.titulo}
        </Text>
        <Text style={styles.duracao}>
          {duracao ? `${duracao} min` : ''}
          {concluido ? (duracao ? ' · assistido' : 'Assistido') : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    paddingVertical: Espacamento.md,
  },
  pressionada: { opacity: 0.65 },
  moldura: {
    width: 128,
    height: 72,
    borderRadius: Raio.sm,
    overflow: 'hidden',
    backgroundColor: Cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagem: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sobreposicao: {
    width: 30,
    height: 30,
    borderRadius: Raio.pilula,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progresso: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  informacoes: { flex: 1, gap: 2 },
  numero: {
    color: Cores.textoTerciario,
    fontSize: Fonte.minuscula,
    fontWeight: '700',
  },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.pequena,
    fontWeight: '600',
    lineHeight: 18,
  },
  duracao: { color: Cores.textoTerciario, fontSize: Fonte.minuscula },
});
