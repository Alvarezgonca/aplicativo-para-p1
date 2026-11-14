import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CabecalhoTela } from '@/componentes/cabecalho-tela';
import { Cartaz } from '@/componentes/cartaz';
import { Carregando, MensagemErro, RodapePaginacao, Vazio } from '@/componentes/estado-tela';
import { Cores, Espacamento } from '@/constants/tema';
import { useLarguraGrade } from '@/hooks/use-largura-grade';
import { usePaginacao } from '@/hooks/use-paginacao';
import { catalogo, traduzirGenero } from '@/services/anilist';
import { comCache, HORA } from '@/services/cache';
import type { AnimeResumo } from '@/services/tipos';

const COLUNAS = 3;

const idDoAnime = (anime: AnimeResumo) => anime.id;

/**
 * Titulos de um genero, do mais popular para o menos popular.
 *
 * A rota e dinamica: /genero/Action, /genero/Romance... O parametro chega como
 * texto pela URL e e o nome que a API conhece, em ingles; na tela ele aparece
 * traduzido.
 */
export default function TelaGenero() {
  const { nome } = useLocalSearchParams<{ nome: string }>();
  const genero = String(nome);
  const recuo = useSafeAreaInsets();
  const largura = useLarguraGrade(COLUNAS);

  const buscarPagina = useCallback(
    (pagina: number, forcar: boolean) =>
      comCache(
        `genero:${genero}:${pagina}`,
        () => catalogo.porGenero(genero, pagina),
        6 * HORA,
        forcar,
      ),
    [genero],
  );
  const lista = usePaginacao(genero, buscarPagina, idDoAnime);

  let conteudo;
  if (lista.loading) {
    conteudo = <Carregando />;
  } else if (lista.erro) {
    conteudo = <MensagemErro mensagem={lista.erro} aoTentarDeNovo={lista.recarregar} />;
  } else if (lista.itens.length === 0) {
    conteudo = <Vazio titulo="Nenhum título neste gênero" icone="albums-outline" />;
  } else {
    conteudo = (
      <FlatList
        data={lista.itens}
        keyExtractor={(anime) => String(anime.id)}
        renderItem={({ item }) => <Cartaz anime={item} largura={largura} />}
        numColumns={COLUNAS}
        columnWrapperStyle={styles.coluna}
        contentContainerStyle={[styles.grade, { paddingBottom: recuo.bottom + Espacamento.xl }]}
        onEndReached={lista.carregarMais}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          <RodapePaginacao
            carregando={lista.carregandoMais}
            erro={lista.erroMais}
            aoTentarDeNovo={lista.carregarMais}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={lista.atualizando}
            onRefresh={lista.atualizar}
            tintColor={Cores.marca}
            colors={[Cores.marca]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CabecalhoTela titulo={traduzirGenero(genero)} subtitulo="Mais populares do gênero" />
      {conteudo}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  grade: { paddingHorizontal: Espacamento.lg, paddingTop: Espacamento.lg },
  coluna: { gap: Espacamento.md, marginBottom: Espacamento.lg },
});
