import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BarraSuperior } from '@/componentes/barra-superior';
import { Cartaz } from '@/componentes/cartaz';
import { Carregando } from '@/componentes/estado-tela';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useMinhaLista, type ItemLista } from '@/contextos/minha-lista';
import { useAlturaBarraAbas } from '@/hooks/use-altura-barra-abas';
import { useLarguraGrade } from '@/hooks/use-largura-grade';

const COLUNAS = 3;

type Ordem = 'recentes' | 'alfabetica' | 'nota';

const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: 'recentes', rotulo: 'Recentes' },
  { valor: 'alfabetica', rotulo: 'A-Z' },
  { valor: 'nota', rotulo: 'Nota' },
];

/** Devolve uma copia ordenada; sort altera o vetor original, e o do contexto nao pode mudar. */
function ordenar(itens: ItemLista[], ordem: Ordem): ItemLista[] {
  const copia = [...itens];
  if (ordem === 'alfabetica') {
    return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
  }
  if (ordem === 'nota') {
    return copia.sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0));
  }
  return copia.sort((a, b) => b.salvoEm - a.salvoEm);
}

export default function TelaLista() {
  const { itens, carregado, remover } = useMinhaLista();
  const alturaAbas = useAlturaBarraAbas();
  const larguraCartaz = useLarguraGrade(COLUNAS);
  const router = useRouter();
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  const [editando, setEditando] = useState(false);

  /** A ordenacao so e refeita quando a lista ou o criterio mudam. */
  const ordenados = useMemo(() => ordenar(itens, ordem), [itens, ordem]);

  /** Confirma antes de remover pelo toque longo, por ser uma acao destrutiva. */
  const confirmarRemocao = (id: number, titulo: string) => {
    Alert.alert('Remover da lista', `Deseja tirar ${titulo} da sua lista?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => remover(id) },
    ]);
  };

  if (!carregado) {
    return (
      <View style={styles.container}>
        <BarraSuperior />
        <Carregando />
      </View>
    );
  }

  const vazia = ordenados.length === 0;

  return (
    <View style={styles.container}>
      <BarraSuperior />

      <FlatList
        data={ordenados}
        keyExtractor={(anime) => String(anime.id)}
        numColumns={COLUNAS}
        columnWrapperStyle={vazia ? undefined : styles.coluna}
        contentContainerStyle={[
          styles.conteudo,
          { paddingBottom: alturaAbas + Espacamento.xl },
          vazia && styles.conteudoVazio,
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => confirmarRemocao(item.id, item.titulo)}
            delayLongPress={350}>
            <Cartaz anime={item} largura={larguraCartaz} mostrarNota={ordem === 'nota'} />

            {/* No modo de edicao, cada cartaz ganha o botao de remover. */}
            {editando ? (
              <Pressable
                style={styles.remover}
                onPress={() => remover(item.id)}
                hitSlop={6}
                accessibilityLabel={`Remover ${item.titulo}`}>
                <Ionicons name="close" size={16} color={Cores.texto} />
              </Pressable>
            ) : null}
          </Pressable>
        )}
        ListHeaderComponent={
          vazia ? undefined : (
            <View style={styles.cabecalho}>
              <View style={styles.linhaTitulo}>
                <View>
                  <Text style={styles.titulo}>Minha lista</Text>
                  <Text style={styles.subtitulo}>
                    {ordenados.length === 1
                      ? '1 título salvo'
                      : `${ordenados.length} títulos salvos`}
                  </Text>
                </View>
                <Pressable
                  style={[styles.botaoEditar, editando && styles.botaoEditarAtivo]}
                  onPress={() => setEditando((atual) => !atual)}>
                  <Ionicons
                    name={editando ? 'checkmark' : 'create-outline'}
                    size={16}
                    color={Cores.texto}
                  />
                  <Text style={styles.textoEditar}>{editando ? 'Concluir' : 'Editar'}</Text>
                </Pressable>
              </View>

              <View style={styles.ordens}>
                <Text style={styles.rotuloOrdem}>Ordenar por</Text>
                {ORDENS.map((item) => {
                  const ativa = item.valor === ordem;
                  return (
                    <Pressable
                      key={item.valor}
                      style={[styles.ordem, ativa && styles.ordemAtiva]}
                      onPress={() => setOrdem(item.valor)}>
                      <Text style={[styles.textoOrdem, ativa && styles.textoOrdemAtiva]}>
                        {item.rotulo}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="bookmark-outline" size={52} color={Cores.textoTerciario} />
            <Text style={styles.vazioTitulo}>Sua lista está vazia</Text>
            <Text style={styles.vazioTexto}>
              Toque em &quot;Minha lista&quot; no detalhe de um anime para guardar o que quer
              assistir depois. A lista fica salva neste aparelho.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
              onPress={() => router.push('/busca')}>
              <Text style={styles.textoBotao}>Explorar catálogo</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { paddingHorizontal: Espacamento.lg, paddingTop: Espacamento.sm },
  conteudoVazio: { flexGrow: 1, justifyContent: 'center' },
  coluna: { gap: Espacamento.md, marginBottom: Espacamento.xl },
  cabecalho: { marginBottom: Espacamento.lg, gap: Espacamento.md },
  linhaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.destaque,
    fontWeight: '800',
  },
  subtitulo: {
    color: Cores.textoSecundario,
    fontSize: Fonte.minuscula,
    fontWeight: '600',
    marginTop: 2,
  },
  botaoEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.xs,
    paddingVertical: Espacamento.sm,
    paddingHorizontal: Espacamento.md,
    borderRadius: Raio.pilula,
    backgroundColor: Cores.superficieAlta,
  },
  botaoEditarAtivo: { backgroundColor: Cores.marca },
  textoEditar: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '700' },
  ordens: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.sm },
  rotuloOrdem: { color: Cores.textoTerciario, fontSize: Fonte.minuscula, marginRight: 2 },
  ordem: {
    paddingVertical: Espacamento.xs,
    paddingHorizontal: Espacamento.md,
    borderRadius: Raio.pilula,
    borderWidth: 1,
    borderColor: Cores.divisoria,
  },
  ordemAtiva: { borderColor: Cores.marca, backgroundColor: 'rgba(244,117,33,0.15)' },
  textoOrdem: { color: Cores.textoSecundario, fontSize: Fonte.minuscula, fontWeight: '700' },
  textoOrdemAtiva: { color: Cores.marca },
  remover: {
    position: 'absolute',
    top: -Espacamento.sm,
    right: -Espacamento.sm,
    zIndex: 1,
    width: 26,
    height: 26,
    borderRadius: Raio.pilula,
    backgroundColor: Cores.erro,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Cores.fundo,
  },
  vazio: { alignItems: 'center', gap: Espacamento.sm, paddingHorizontal: Espacamento.xl },
  vazioTitulo: {
    color: Cores.texto,
    fontSize: Fonte.titulo,
    fontWeight: '700',
    marginTop: Espacamento.sm,
  },
  vazioTexto: {
    color: Cores.textoSecundario,
    fontSize: Fonte.pequena,
    textAlign: 'center',
    lineHeight: 20,
  },
  botao: {
    backgroundColor: Cores.marca,
    paddingVertical: Espacamento.md,
    paddingHorizontal: Espacamento.xl,
    borderRadius: Raio.sm,
    marginTop: Espacamento.lg,
  },
  pressionado: { opacity: 0.7 },
  textoBotao: {
    color: Cores.texto,
    fontSize: Fonte.corpo,
    fontWeight: '700',
  },
});
