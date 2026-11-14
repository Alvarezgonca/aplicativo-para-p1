import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BarraSuperior } from '@/componentes/barra-superior';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { FRACAO_CONCLUIDO, useHistorico } from '@/contextos/historico';
import { useMinhaLista } from '@/contextos/minha-lista';
import { useSessao } from '@/contextos/sessao';
import { useAlturaBarraAbas } from '@/hooks/use-altura-barra-abas';
import { useFetch } from '@/hooks/use-fetch';
import { ErroApi } from '@/services/api';
import { buscarPerfil, type Perfil } from '@/services/autenticacao';
import { comCache, MINUTO } from '@/services/cache';

type NomeIcone = keyof typeof Ionicons.glyphMap;

interface Atalho {
  icone: NomeIcone;
  rotulo: string;
  destino: Href;
}

const ATALHOS: Atalho[] = [
  { icone: 'time-outline', rotulo: 'Histórico', destino: '/historico' },
  { icone: 'bookmark-outline', rotulo: 'Minha lista', destino: '/lista' },
  { icone: 'calendar-outline', rotulo: 'Lançamentos da semana', destino: '/simulcast' },
  { icone: 'trophy-outline', rotulo: 'Ranking', destino: '/ranking' },
];

/** Minutos em texto curto: "45 min" ou "3,5 h". */
function formatarTempo(minutos: number): string {
  if (minutos < 60) {
    return `${Math.round(minutos)} min`;
  }
  return `${(minutos / 60).toFixed(1).replace('.', ',')} h`;
}

/** Linhas da ficha da conta, so com o que a API devolveu. */
function montarDetalhes(perfil: Perfil): [string, string][] {
  const linhas: [string, string][] = [['Usuário', perfil.usuario]];
  if (perfil.idade) linhas.push(['Idade', `${perfil.idade} anos`]);
  if (perfil.nascimento) {
    const [ano, mes, dia] = perfil.nascimento.split('-');
    linhas.push(['Nascimento', `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`]);
  }
  const local = [perfil.cidade, perfil.pais].filter(Boolean).join(', ');
  if (local) linhas.push(['Local', local]);
  if (perfil.telefone) linhas.push(['Telefone', perfil.telefone]);
  return linhas;
}

/**
 * Perfil do usuario logado.
 *
 * O topo usa o que ja esta salvo na sessao, entao aparece na hora. A ficha
 * da conta vem do GET /auth/me, que exige o token no cabecalho; se a API
 * responder 401 (token vencido), a sessao e encerrada e o layout protegido
 * leva o usuario de volta ao login. As estatisticas sao calculadas a partir
 * da lista e do historico guardados no aparelho.
 */
export default function TelaPerfil() {
  const router = useRouter();
  const alturaAbas = useAlturaBarraAbas();
  const { usuario, token, sair } = useSessao();
  const { itens: salvos } = useMinhaLista();
  const { registros } = useHistorico();

  const buscar = useCallback(
    (forcar: boolean) =>
      comCache(
        `perfil:${usuario?.id ?? 0}`,
        async () => {
          try {
            return await buscarPerfil(token ?? '');
          } catch (erro) {
            if (erro instanceof ErroApi && erro.status === 401) {
              sair();
            }
            throw erro;
          }
        },
        30 * MINUTO,
        forcar,
      ),
    [usuario?.id, token, sair],
  );
  const { dados: perfil, loading, erro, atualizando, recarregar, atualizar } = useFetch(buscar);

  const estatisticas = useMemo(() => {
    const minutos = registros.reduce((total, item) => total + item.duracao * item.progresso, 0);
    return [
      { valor: String(salvos.length), rotulo: 'Na lista' },
      {
        valor: String(registros.filter((item) => item.progresso >= FRACAO_CONCLUIDO).length),
        rotulo: 'Episódios vistos',
      },
      { valor: formatarTempo(minutos), rotulo: 'Assistido' },
    ];
  }, [salvos.length, registros]);

  /** Pede confirmacao antes de sair. No navegador o Alert com botoes nao existe. */
  function confirmarSaida() {
    if (Platform.OS === 'web') {
      sair();
      return;
    }
    Alert.alert('Sair da conta', 'Sua lista e seu histórico continuam salvos neste aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => sair() },
    ]);
  }

  if (!usuario) {
    return null;
  }

  const iniciais = `${usuario.nome[0] ?? ''}${usuario.sobrenome[0] ?? ''}`.toUpperCase();

  return (
    <View style={styles.container}>
      <BarraSuperior />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.conteudo, { paddingBottom: alturaAbas + Espacamento.xl }]}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizar}
            tintColor={Cores.marca}
            colors={[Cores.marca]}
          />
        }>
        <View style={styles.identificacao}>
          <View style={styles.avatar}>
            <Text style={styles.iniciais}>{iniciais}</Text>
            <Image source={usuario.foto} style={styles.foto} contentFit="cover" transition={200} />
          </View>
          <View style={styles.dados}>
            <Text style={styles.nome}>
              {usuario.nome} {usuario.sobrenome}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {usuario.email}
            </Text>
            <Text style={styles.arroba}>@{usuario.usuario}</Text>
          </View>
        </View>

        <View style={styles.estatisticas}>
          {estatisticas.map((item) => (
            <View key={item.rotulo} style={styles.estatistica}>
              <Text style={styles.valor}>{item.valor}</Text>
              <Text style={styles.rotulo}>{item.rotulo}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.tituloGrupo}>Dados da conta</Text>
        <View style={styles.grupo}>
          {loading ? (
            <View style={styles.estadoFicha}>
              <ActivityIndicator color={Cores.marca} />
            </View>
          ) : erro || !perfil ? (
            <Pressable style={styles.estadoFicha} onPress={recarregar}>
              <Text style={styles.textoEstado}>{erro ?? 'Dados indisponíveis.'}</Text>
              <Text style={styles.link}>Tocar para tentar de novo</Text>
            </Pressable>
          ) : (
            montarDetalhes(perfil).map(([rotulo, valor], indice) => (
              <View key={rotulo}>
                {indice > 0 ? <View style={styles.divisoria} /> : null}
                <View style={styles.linha}>
                  <Text style={styles.linhaRotulo}>{rotulo}</Text>
                  <Text style={styles.detalhe}>{valor}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.tituloGrupo}>Atalhos</Text>
        <View style={styles.grupo}>
          {ATALHOS.map((atalho, indice) => (
            <View key={atalho.rotulo}>
              {indice > 0 ? <View style={styles.divisoria} /> : null}
              <Pressable
                style={({ pressed }) => [styles.linha, pressed && styles.pressionada]}
                onPress={() => router.push(atalho.destino)}>
                <Ionicons name={atalho.icone} size={20} color={Cores.textoSecundario} />
                <Text style={styles.linhaRotulo}>{atalho.rotulo}</Text>
                <Ionicons name="chevron-forward" size={16} color={Cores.textoTerciario} />
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.sair, pressed && styles.pressionada]}
          onPress={confirmarSaida}>
          <Ionicons name="log-out-outline" size={18} color={Cores.erro} />
          <Text style={styles.textoSair}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { paddingHorizontal: Espacamento.lg },
  identificacao: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Raio.pilula,
    backgroundColor: Cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iniciais: { color: Cores.texto, fontSize: Fonte.destaque, fontWeight: '800' },
  // A foto fica por cima das iniciais; enquanto carrega (ou se falhar), as
  // iniciais aparecem no lugar.
  foto: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  dados: { flex: 1, gap: 2 },
  nome: { color: Cores.texto, fontSize: Fonte.titulo, fontWeight: '700' },
  email: { color: Cores.textoSecundario, fontSize: Fonte.pequena },
  arroba: { color: Cores.marca, fontSize: Fonte.pequena, fontWeight: '600' },
  estatisticas: {
    flexDirection: 'row',
    backgroundColor: Cores.superficie,
    borderRadius: Raio.lg,
    paddingVertical: Espacamento.lg,
    marginTop: Espacamento.xl,
  },
  estatistica: { flex: 1, alignItems: 'center', gap: 2 },
  valor: { color: Cores.texto, fontSize: Fonte.destaque, fontWeight: '800' },
  rotulo: { color: Cores.textoTerciario, fontSize: Fonte.minuscula },
  tituloGrupo: {
    color: Cores.textoTerciario,
    fontSize: Fonte.minuscula,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: Espacamento.xl,
    marginBottom: Espacamento.sm,
  },
  grupo: {
    backgroundColor: Cores.superficie,
    borderRadius: Raio.lg,
    overflow: 'hidden',
  },
  estadoFicha: { paddingVertical: Espacamento.xl, alignItems: 'center', gap: Espacamento.xs },
  textoEstado: { color: Cores.textoSecundario, fontSize: Fonte.pequena },
  link: { color: Cores.marca, fontSize: Fonte.pequena, fontWeight: '700' },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md + 2,
  },
  pressionada: { backgroundColor: Cores.superficieAlta },
  linhaRotulo: { flex: 1, color: Cores.texto, fontSize: Fonte.pequena },
  detalhe: { color: Cores.textoSecundario, fontSize: Fonte.pequena },
  divisoria: {
    height: 1,
    backgroundColor: Cores.divisoria,
    marginLeft: Espacamento.lg,
  },
  sair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.sm,
    paddingVertical: Espacamento.lg,
    marginTop: Espacamento.xl,
    borderRadius: Raio.lg,
    borderWidth: 1,
    borderColor: Cores.divisoria,
  },
  textoSair: { color: Cores.erro, fontSize: Fonte.corpo, fontWeight: '700' },
});
