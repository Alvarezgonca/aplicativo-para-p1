import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CabecalhoTela } from '@/componentes/cabecalho-tela';
import { CampoFormulario } from '@/componentes/campo-formulario';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useSessao } from '@/contextos/sessao';
import { mensagemDeErro } from '@/services/api';

const O_QUE_SAI = [
  'Seus dados de cadastro (nome, e-mail e senha)',
  'A minha lista, em todos os aparelhos',
  'O histórico e o ponto onde você parou cada episódio',
  'As sessões abertas em outros celulares',
];

/**
 * Exclusao de conta.
 *
 * Pede a senha de novo antes de apagar, mesmo com o usuario logado: o
 * servidor confere e so entao apaga a conta e tudo o que pertence a ela.
 * Quando da certo, a sessao local tambem some e o layout protegido leva o
 * usuario ao login sozinho, entao a tela nao precisa navegar.
 */
export default function TelaExcluirConta() {
  const { usuario, excluirConta } = useSessao();
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    if (!senha) {
      setErro('Digite a sua senha para confirmar.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await excluirConta(senha);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <CabecalhoTela titulo="Excluir conta" />
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <View style={styles.alerta}>
          <Ionicons name="warning-outline" size={28} color={Cores.erro} />
          <Text style={styles.tituloAlerta}>Esta ação não pode ser desfeita</Text>
          <Text style={styles.textoAlerta}>
            A conta {usuario?.email} será apagada do servidor. Vão junto:
          </Text>
          {O_QUE_SAI.map((item) => (
            <View key={item} style={styles.item}>
              <Ionicons name="close-circle-outline" size={16} color={Cores.erro} />
              <Text style={styles.textoItem}>{item}</Text>
            </View>
          ))}
        </View>

        <CampoFormulario
          rotulo="Senha atual"
          icone="lock-closed-outline"
          senha
          value={senha}
          onChangeText={setSenha}
          placeholder="digite a sua senha"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="done"
          editable={!enviando}
          onSubmitEditing={confirmar}
        />

        {erro ? (
          <View style={styles.erro}>
            <Ionicons name="alert-circle" size={18} color={Cores.erro} />
            <Text style={styles.textoErro}>{erro}</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.botao, (pressed || enviando) && styles.pressionado]}
          onPress={confirmar}
          disabled={enviando}
          accessibilityRole="button"
          accessibilityLabel="Excluir minha conta">
          {enviando ? (
            <ActivityIndicator color={Cores.texto} />
          ) : (
            <Text style={styles.textoBotao}>Excluir minha conta</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { padding: Espacamento.lg, gap: Espacamento.md },
  alerta: {
    backgroundColor: 'rgba(229,72,77,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229,72,77,0.35)',
    borderRadius: Raio.lg,
    padding: Espacamento.lg,
    gap: Espacamento.sm,
  },
  tituloAlerta: { color: Cores.texto, fontSize: Fonte.titulo, fontWeight: '800' },
  textoAlerta: { color: Cores.textoSecundario, fontSize: Fonte.pequena, lineHeight: 20 },
  item: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.sm },
  textoItem: { flex: 1, color: Cores.texto, fontSize: Fonte.pequena },
  erro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    backgroundColor: 'rgba(229,72,77,0.12)',
    borderRadius: Raio.md,
    padding: Espacamento.md,
  },
  textoErro: { flex: 1, color: Cores.erro, fontSize: Fonte.pequena, fontWeight: '600' },
  botao: {
    backgroundColor: Cores.erro,
    borderRadius: Raio.sm,
    paddingVertical: Espacamento.lg,
    alignItems: 'center',
    marginTop: Espacamento.sm,
  },
  pressionado: { opacity: 0.7 },
  textoBotao: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '700' },
});
