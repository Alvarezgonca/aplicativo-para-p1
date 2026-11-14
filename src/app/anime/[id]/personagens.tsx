import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CabecalhoTela } from '@/componentes/cabecalho-tela';
import { Carregando, MensagemErro, RodapePaginacao, Vazio } from '@/componentes/estado-tela';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginacao } from '@/hooks/use-paginacao';
import { catalogo } from '@/services/anilist';
import { comCache, HORA, MINUTO } from '@/services/cache';
import type { PersonagemResumo } from '@/services/tipos';

const idDoPersonagem = (personagem: PersonagemResumo) => personagem.id;

function LinhaPersonagem({ personagem }: { personagem: PersonagemResumo }) {
  return (
    <View style={styles.linha}>
      <Image source={personagem.imagem} style={styles.foto} contentFit="cover" transition={200} />
      <View style={styles.informacoes}>
        <Text style={styles.nome} numberOfLines={1}>
          {personagem.nome}
        </Text>
        <Text style={styles.papel}>{personagem.papel}</Text>
        {personagem.dublador ? (
          <Text style={styles.dublador} numberOfLines={1}>
            Voz original: {personagem.dublador}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Elenco completo de um anime, em paginas de 25 personagens.
 *
 * Rota aninhada: /anime/154587/personagens. O identificador vem da pasta
 * [id], a mesma da tela de detalhe. O nome do anime no subtitulo sai do
 * cache que a tela de detalhe acabou de preencher, sem nova requisicao.
 */
export default function TelaPersonagens() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const animeId = Number(id);
  const recuo = useSafeAreaInsets();

  const buscarAnime = useCallback(
    (forcar: boolean) =>
      comCache(`anime:${animeId}`, () => catalogo.anime(animeId), 30 * MINUTO, forcar),
    [animeId],
  );
  const { dados: anime } = useFetch(buscarAnime);

  const buscarPagina = useCallback(
    (pagina: number, forcar: boolean) =>
      comCache(
        `personagens:${animeId}:${pagina}`,
        () => catalogo.personagens(animeId, pagina),
        6 * HORA,
        forcar,
      ),
    [animeId],
  );
  const lista = usePaginacao(String(animeId), buscarPagina, idDoPersonagem);

  let conteudo;
  if (lista.loading) {
    conteudo = <Carregando />;
  } else if (lista.erro) {
    conteudo = <MensagemErro mensagem={lista.erro} aoTentarDeNovo={lista.recarregar} />;
  } else if (lista.itens.length === 0) {
    conteudo = <Vazio titulo="Nenhum personagem cadastrado" icone="people-outline" />;
  } else {
    conteudo = (
      <FlatList
        data={lista.itens}
        keyExtractor={(personagem) => String(personagem.id)}
        renderItem={({ item }) => <LinhaPersonagem personagem={item} />}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        onEndReached={lista.carregarMais}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          <RodapePaginacao
            carregando={lista.carregandoMais}
            erro={lista.erroMais}
            aoTentarDeNovo={lista.carregarMais}
          />
        }
        contentContainerStyle={{ paddingBottom: recuo.bottom + Espacamento.xl }}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CabecalhoTela titulo="Personagens" subtitulo={anime?.titulo} />
      {conteudo}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md,
  },
  foto: {
    width: 56,
    height: 56,
    borderRadius: Raio.pilula,
    backgroundColor: Cores.superficie,
  },
  informacoes: { flex: 1, gap: 2 },
  nome: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '700' },
  papel: { color: Cores.marca, fontSize: Fonte.minuscula, fontWeight: '700' },
  dublador: { color: Cores.textoTerciario, fontSize: Fonte.minuscula },
  separador: { height: 1, backgroundColor: Cores.divisoria, marginLeft: 88 },
});
