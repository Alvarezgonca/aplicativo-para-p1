import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import type { Usuario } from '@/services/autenticacao';
import { comCache, MINUTO } from '@/services/cache';
import { buscarConta } from '@/services/conta';
import { contarPendentes } from '@/services/sincronizacao';

type NomeIcone = keyof typeof Ionicons.glyphMap;

interface Atalho {
  icone: NomeIcone;
  rotulo: string;
  destino: Href;
}

const ATALHOS: Atalho[] = [
  { icone: 'time-outline', rotulo: 'Histórico', destino: '/historico' },
  { icone: 'settings-outline', rotulo: 'Configurações', destino: '/configuracoes' },
  { icone: 'bookmark-outline', rotulo: 'Minha lista', destino: '/lista' },
  { icone: 'calendar-outline', rotulo: 'Lançamentos da semana', destino: '/simulcast' },
  { icone: 'trophy-outline', rotulo: 'Ranking', destino: '/ranking' },
  { icone: 'information-circle-outline', rotulo: 'Sobre o aplicativo', destino: '/sobre' },
];

/** Minutos em texto curto: "45 min" ou "3,5 h". */
function formatarTempo(minutos: number): string {
  if (minutos < 60) {
    return `${Math.round(minutos)} min`;
  }
  return `${(minutos / 60).toFixed(1).replace('.', ',')} h`;
}

/** Linhas da ficha da conta, com o que o servidor devolveu. */
function montarDetalhes(conta: Usuario): [string, string][] {
  const criadaEm = new Date(conta.criadoEm).toLocaleDateString('pt-BR');
  return [
    ['Nome', conta.nome],
    ['E-mail', conta.email],
    ['Conta criada em', criadaEm],
  ];
}

/** Situacao da fila de sincronizacao em texto curto. */
function textoSincronizacao(pendentes: number | null): string {
  if (pendentes === null) return '...';
  if (pendentes === 0) return 'Tudo salvo na conta';
  return pendentes === 1
    ? '1 alteração aguardando internet'
    : `${pendentes} alterações aguardando internet`;
}

/** Iniciais do nome para o avatar: "Ana Clara Souza" vira "AS". */
function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return `${primeira}${ultima}`.toUpperCase();
}

/**
 * Perfil do usuario logado.
 *
 * O topo usa o que ja esta salvo na sessao, entao aparece na hora. A ficha
 * da conta vem do GET /usuarios/eu da API do aplicativo, que exige o token
 * no cabecalho; o cliente da API renova o token sozinho e, se a sessao tiver
 * acabado no servidor, o layout protegido leva o usuario de volta ao login.
 * As estatisticas sao calculadas a partir da lista e do historico.
 */
export default function TelaPerfil() {
  const router = useRouter();
  const alturaAbas = useAlturaBarraAbas();
  const { usuario, sair } = useSessao();
  const { itens: salvos } = useMinhaLista();
  const { registros } = useHistorico();

  const buscar = useCallback(
    (forcar: boolean) => comCache(`conta:${usuario?.id ?? ''}`, buscarConta, 30 * MINUTO, forcar),
    [usuario?.id],
  );
  const { dados: conta, loading, erro, atualizando, recarregar, atualizar } = useFetch(buscar);

  // Quantas mudancas da lista e do historico ainda nao chegaram ao servidor.
  // Relido toda vez que a aba ganha foco.
  const [pendentes, setPendentes] = useState<number | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!usuario) {
        return;
      }
      let ativo = true;
      contarPendentes(usuario.id).then((total) => {
        if (ativo) {
          setPendentes(total);
        }
      });
      return () => {
        ativo = false;
      };
    }, [usuario]),
  );

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
    Alert.alert('Sair da conta', 'Sua lista e seu histórico continuam salvos na sua conta.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => sair() },
    ]);
  }

  if (!usuario) {
    return null;
  }

  const iniciais = iniciaisDe(usuario.nome);

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
          </View>
          <View style={styles.dados}>
            <Text style={styles.nome} numberOfLines={1}>
              {usuario.nome}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {usuario.email}
            </Text>
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
          ) : erro || !conta ? (
            <Pressable style={styles.estadoFicha} onPress={recarregar}>
              <Text style={styles.textoEstado}>{erro ?? 'Dados indisponíveis.'}</Text>
              <Text style={styles.link}>Tocar para tentar de novo</Text>
            </Pressable>
          ) : (
            [...montarDetalhes(conta), ['Sincronização', textoSincronizacao(pendentes)]].map(
              ([rotulo, valor], indice) => (
                <View key={rotulo}>
                  {indice > 0 ? <View style={styles.divisoria} /> : null}
                  <View style={styles.linha}>
                    <Text style={styles.linhaRotulo}>{rotulo}</Text>
                    <Text style={styles.detalhe}>{valor}</Text>
                  </View>
                </View>
              ),
            )
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
  dados: { flex: 1, gap: 2 },
  nome: { color: Cores.texto, fontSize: Fonte.titulo, fontWeight: '700' },
  email: { color: Cores.textoSecundario, fontSize: Fonte.pequena },
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
