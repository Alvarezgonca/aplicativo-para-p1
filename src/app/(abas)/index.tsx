import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { BarraSuperior } from '@/componentes/barra-superior';
import { Carrossel } from '@/componentes/carrossel';
import { Destaque } from '@/componentes/destaque';
import { Carregando, MensagemErro } from '@/componentes/estado-tela';
import { Cores, Espacamento } from '@/constants/tema';
import { useAlturaBarraAbas } from '@/hooks/use-altura-barra-abas';
import { useFetch } from '@/hooks/use-fetch';
import { catalogo } from '@/services/anilist';
import { comCache, MINUTO } from '@/services/cache';
import type { CriterioRanking } from '@/services/tipos';

/**
 * Tela inicial.
 *
 * As quatro fileiras chegam da API em uma unica requisicao e ficam 30 minutos
 * no cache: ao voltar para a aba, a tela aparece na hora, sem nova consulta.
 * Puxar a lista para baixo ignora o cache e busca tudo de novo.
 */
export default function TelaInicio() {
  const alturaAbas = useAlturaBarraAbas();
  const router = useRouter();

  /** O "Ver tudo" abre o ranking ja no criterio da fileira tocada. */
  function verTudo(criterio: CriterioRanking) {
    router.push({ pathname: '/ranking', params: { criterio } });
  }

  const buscarInicio = useCallback(
    (forcar: boolean) => comCache('inicio', catalogo.inicio, 30 * MINUTO, forcar),
    [],
  );
  const { dados, loading, erro, atualizando, recarregar, atualizar } = useFetch(buscarInicio);

  if (loading) {
    return (
      <View style={styles.container}>
        <BarraSuperior />
        <Carregando mensagem="Carregando o catálogo..." />
      </View>
    );
  }

  if (erro || !dados) {
    return (
      <View style={styles.container}>
        <BarraSuperior />
        <MensagemErro mensagem={erro ?? 'Catálogo indisponível.'} aoTentarDeNovo={recarregar} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarraSuperior sobreposta />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: alturaAbas + Espacamento.xl }}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizar}
            tintColor={Cores.marca}
            colors={[Cores.marca]}
            progressBackgroundColor={Cores.superficie}
          />
        }>
        <Destaque animes={dados.destaques} />

        <Carrossel
          titulo="Lançamentos da temporada"
          animes={dados.temporada}
          aoVerTudo={() => verTudo('temporada')}
        />
        <Carrossel
          titulo="Mais populares"
          animes={dados.populares}
          aoVerTudo={() => verTudo('populares')}
        />
        <Carrossel
          titulo="Mais bem avaliados"
          animes={dados.melhores}
          aoVerTudo={() => verTudo('melhores')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
});
