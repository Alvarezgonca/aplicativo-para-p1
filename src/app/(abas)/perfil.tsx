import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { BarraSuperior } from '@/componentes/barra-superior';
import { Selo } from '@/componentes/selo';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useAlturaBarraAbas } from '@/hooks/use-altura-barra-abas';
import { useMinhaLista } from '@/contextos/minha-lista';
import { animes } from '@/dados/animes';
import { listarEpisodios } from '@/dados/episodios';

type NomeIcone = keyof typeof Ionicons.glyphMap;

const opcoes: { icone: NomeIcone; rotulo: string; detalhe: string }[] = [
  { icone: 'language-outline', rotulo: 'Idioma do conteudo', detalhe: 'Portugues (Brasil)' },
  { icone: 'cloud-download-outline', rotulo: 'Downloads', detalhe: 'Apenas no Wi-Fi' },
  { icone: 'tv-outline', rotulo: 'Qualidade de video', detalhe: 'Automatica' },
  { icone: 'card-outline', rotulo: 'Assinatura', detalhe: 'Mega Fan' },
  { icone: 'help-circle-outline', rotulo: 'Ajuda', detalhe: '' },
];

export default function TelaPerfil() {
  const { salvos } = useMinhaLista();
  const alturaAbas = useAlturaBarraAbas();
  const [notificacoes, setNotificacoes] = useState(true);
  const [apenasDublados, setApenasDublados] = useState(false);

  /**
   * Estatisticas derivadas do catalogo e da lista salva. O calculo depende de
   * dados que mudam pouco, entao fica memorizado pela quantidade de salvos.
   */
  const estatisticas = useMemo(() => {
    const episodiosAssistidos = animes
      .flatMap((anime) => listarEpisodios(anime.id))
      .filter((episodio) => episodio.progresso >= 1);

    const minutos = episodiosAssistidos.reduce((total, episodio) => total + episodio.duracao, 0);

    return {
      salvos: salvos.length,
      episodios: episodiosAssistidos.length,
      horas: Math.round(minutos / 60),
    };
  }, [salvos.length]);

  return (
    <View style={styles.container}>
      <BarraSuperior />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.conteudo, { paddingBottom: alturaAbas + Espacamento.xl }]}>
        <View style={styles.identificacao}>
          <View style={styles.avatar}>
            <Text style={styles.iniciais}>DC</Text>
          </View>
          <View style={styles.dados}>
            <Text style={styles.nome}>Daniel e Clara</Text>
            <Text style={styles.email}>dupla@aplicativoshibridos.dev</Text>
            <Selo texto="MEGA FAN" variante="marca" style={styles.plano} />
          </View>
        </View>

        <View style={styles.estatisticas}>
          {[
            { valor: estatisticas.salvos, rotulo: 'Na lista' },
            { valor: estatisticas.episodios, rotulo: 'Episodios' },
            { valor: estatisticas.horas, rotulo: 'Horas' },
          ].map((item) => (
            <View key={item.rotulo} style={styles.estatistica}>
              <Text style={styles.valor}>{item.valor}</Text>
              <Text style={styles.rotulo}>{item.rotulo}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.tituloGrupo}>Preferencias</Text>

        <View style={styles.grupo}>
          <View style={styles.linha}>
            <Ionicons name="notifications-outline" size={20} color={Cores.textoSecundario} />
            <Text style={styles.linhaRotulo}>Avisar sobre episodios novos</Text>
            <Switch
              value={notificacoes}
              onValueChange={setNotificacoes}
              trackColor={{ false: Cores.superficieAlta, true: Cores.marcaEscura }}
              thumbColor={notificacoes ? Cores.marca : Cores.textoTerciario}
            />
          </View>

          <View style={styles.divisoria} />

          <View style={styles.linha}>
            <Ionicons name="mic-outline" size={20} color={Cores.textoSecundario} />
            <Text style={styles.linhaRotulo}>Mostrar apenas dublados</Text>
            <Switch
              value={apenasDublados}
              onValueChange={setApenasDublados}
              trackColor={{ false: Cores.superficieAlta, true: Cores.marcaEscura }}
              thumbColor={apenasDublados ? Cores.marca : Cores.textoTerciario}
            />
          </View>
        </View>

        <Text style={styles.tituloGrupo}>Conta</Text>

        <View style={styles.grupo}>
          {opcoes.map((opcao, indice) => (
            <View key={opcao.rotulo}>
              {indice > 0 ? <View style={styles.divisoria} /> : null}
              <Pressable style={({ pressed }) => [styles.linha, pressed && styles.pressionada]}>
                <Ionicons name={opcao.icone} size={20} color={Cores.textoSecundario} />
                <Text style={styles.linhaRotulo}>{opcao.rotulo}</Text>
                {opcao.detalhe ? <Text style={styles.detalhe}>{opcao.detalhe}</Text> : null}
                <Ionicons name="chevron-forward" size={16} color={Cores.textoTerciario} />
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.sair, pressed && styles.pressionada]}>
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
    width: 64,
    height: 64,
    borderRadius: Raio.pilula,
    backgroundColor: Cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciais: { color: Cores.texto, fontSize: Fonte.destaque, fontWeight: '800' },
  dados: { flex: 1, gap: 2 },
  nome: { color: Cores.texto, fontSize: Fonte.titulo, fontWeight: '700' },
  email: { color: Cores.textoTerciario, fontSize: Fonte.pequena },
  plano: { marginTop: Espacamento.xs },
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
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md + 2,
  },
  pressionada: { backgroundColor: Cores.superficieAlta },
  linhaRotulo: { flex: 1, color: Cores.texto, fontSize: Fonte.pequena },
  detalhe: { color: Cores.textoTerciario, fontSize: Fonte.pequena },
  divisoria: {
    height: 1,
    backgroundColor: Cores.divisoria,
    marginLeft: Espacamento.lg + 20 + Espacamento.md,
  },
  sair: {
    alignItems: 'center',
    paddingVertical: Espacamento.lg,
    marginTop: Espacamento.xl,
    borderRadius: Raio.lg,
    borderWidth: 1,
    borderColor: Cores.divisoria,
  },
  textoSair: { color: Cores.erro, fontSize: Fonte.corpo, fontWeight: '700' },
});
