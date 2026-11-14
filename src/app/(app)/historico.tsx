import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BarraProgresso } from '@/componentes/barra-progresso';
import { CabecalhoTela } from '@/componentes/cabecalho-tela';
import { Carregando, Vazio } from '@/componentes/estado-tela';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { FRACAO_CONCLUIDO, useHistorico, type RegistroHistorico } from '@/contextos/historico';

const DIA_MS = 24 * 60 * 60 * 1000;

/** "Hoje, 21:05", "Ontem, 09:40" ou "12/11, 18:00". */
function quando(momento: number, agora: number): string {
  const data = new Date(momento);
  const hora = `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;

  const inicioHoje = new Date(agora);
  inicioHoje.setHours(0, 0, 0, 0);
  if (momento >= inicioHoje.getTime()) {
    return `Hoje, ${hora}`;
  }
  if (momento >= inicioHoje.getTime() - DIA_MS) {
    return `Ontem, ${hora}`;
  }
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}, ${hora}`;
}

function LinhaHistorico({ registro, agora }: { registro: RegistroHistorico; agora: number }) {
  const router = useRouter();
  const concluido = registro.progresso >= FRACAO_CONCLUIDO;

  return (
    <Pressable
      style={({ pressed }) => [styles.linha, pressed && styles.pressionada]}
      onPress={() =>
        router.push({
          pathname: '/player/[animeId]',
          params: { animeId: registro.animeId, episodio: registro.episodio },
        })
      }>
      <View style={styles.moldura}>
        <Image
          source={registro.miniatura ?? registro.banner ?? registro.capa}
          style={styles.imagem}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.progresso}>
          <BarraProgresso progresso={registro.progresso} />
        </View>
      </View>

      <View style={styles.informacoes}>
        <Text style={styles.titulo} numberOfLines={1}>
          {registro.titulo}
        </Text>
        <Text style={styles.episodio} numberOfLines={2}>
          E{registro.episodio} · {registro.tituloEpisodio}
        </Text>
        <View style={styles.rodapeLinha}>
          {concluido ? (
            <View style={styles.assistido}>
              <Ionicons name="checkmark-circle" size={14} color={Cores.sucesso} />
              <Text style={styles.textoAssistido}>Assistido</Text>
            </View>
          ) : (
            <Text style={styles.quando}>{Math.round(registro.progresso * 100)}% assistido</Text>
          )}
          <Text style={styles.quando}>{quando(registro.assistidoEm, agora)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Historico de reproducao do usuario logado, do mais recente para o mais
 * antigo. Tocar em um item volta a reproduzir de onde parou.
 */
export default function TelaHistorico() {
  const { registros, carregado, limpar } = useHistorico();
  // Lido uma vez ao abrir a tela, para os rotulos de data serem estaveis.
  const [agora] = useState(() => Date.now());

  /** Limpar apaga tudo de uma vez, entao pede confirmacao no celular. */
  function confirmarLimpeza() {
    if (Platform.OS === 'web') {
      limpar();
      return;
    }
    Alert.alert('Limpar histórico', 'O progresso de todos os episódios será apagado.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: limpar },
    ]);
  }

  const quantidade = registros.length;

  return (
    <View style={styles.container}>
      <CabecalhoTela
        titulo="Histórico"
        subtitulo={
          quantidade === 0 ? undefined : quantidade === 1 ? '1 episódio' : `${quantidade} episódios`
        }
        direita={
          quantidade > 0 ? (
            <Pressable onPress={confirmarLimpeza} hitSlop={8}>
              <Text style={styles.limpar}>Limpar</Text>
            </Pressable>
          ) : undefined
        }
      />

      {!carregado ? (
        <Carregando />
      ) : (
        <FlatList
          data={registros}
          keyExtractor={(item) => `${item.animeId}-${item.episodio}`}
          renderItem={({ item }) => <LinhaHistorico registro={item} agora={agora} />}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          contentContainerStyle={[styles.lista, quantidade === 0 && styles.listaVazia]}
          ListEmptyComponent={
            <Vazio
              icone="time-outline"
              titulo="Nada assistido ainda"
              texto="Os episódios que você assistir aparecem aqui, com o ponto onde parou."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  limpar: { color: Cores.marca, fontSize: Fonte.pequena, fontWeight: '700' },
  lista: { padding: Espacamento.lg, paddingBottom: Espacamento.xxl },
  listaVazia: { flexGrow: 1 },
  separador: { height: Espacamento.lg },
  linha: { flexDirection: 'row', gap: Espacamento.md, borderRadius: Raio.md },
  pressionada: { opacity: 0.7 },
  moldura: {
    width: 140,
    height: 79,
    borderRadius: Raio.md,
    overflow: 'hidden',
    backgroundColor: Cores.superficie,
  },
  imagem: { width: '100%', height: '100%' },
  progresso: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  informacoes: { flex: 1, gap: 2 },
  titulo: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '700' },
  episodio: { color: Cores.textoSecundario, fontSize: Fonte.minuscula, lineHeight: 16 },
  rodapeLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  assistido: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textoAssistido: { color: Cores.sucesso, fontSize: Fonte.minuscula, fontWeight: '700' },
  quando: { color: Cores.textoTerciario, fontSize: Fonte.minuscula },
});
