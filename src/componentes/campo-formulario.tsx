import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';

type NomeIcone = keyof typeof Ionicons.glyphMap;

interface Props extends TextInputProps {
  rotulo: string;
  icone: NomeIcone;
  /** Campo de senha: esconde o texto e mostra o botao de olho. */
  senha?: boolean;
  /** Texto pequeno abaixo do campo (dica ou regra). */
  ajuda?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

/**
 * Campo de formulario com rotulo e icone, usado no login, no cadastro e na
 * exclusao de conta. O ref chega ao TextInput, para a tela poder pular para
 * o proximo campo ao apertar "proximo" no teclado.
 */
export function CampoFormulario({ rotulo, icone, senha, ajuda, ref, ...entrada }: Props) {
  const [visivel, setVisivel] = useState(false);

  return (
    <View style={styles.bloco}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <View style={styles.campo}>
        <Ionicons name={icone} size={18} color={Cores.textoTerciario} />
        <TextInput
          ref={ref}
          style={styles.entrada}
          placeholderTextColor={Cores.textoTerciario}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={senha && !visivel}
          accessibilityLabel={rotulo}
          {...entrada}
        />
        {senha ? (
          <Pressable
            onPress={() => setVisivel((atual) => !atual)}
            hitSlop={8}
            accessibilityLabel={visivel ? 'Esconder senha' : 'Mostrar senha'}>
            <Ionicons
              name={visivel ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Cores.textoSecundario}
            />
          </Pressable>
        ) : null}
      </View>
      {ajuda ? <Text style={styles.ajuda}>{ajuda}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: Espacamento.sm, marginTop: Espacamento.sm },
  rotulo: { color: Cores.textoSecundario, fontSize: Fonte.pequena, fontWeight: '600' },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    backgroundColor: Cores.superficie,
    borderWidth: 1,
    borderColor: Cores.divisoria,
    borderRadius: Raio.md,
    paddingHorizontal: Espacamento.md,
  },
  entrada: {
    flex: 1,
    color: Cores.texto,
    fontSize: Fonte.corpo,
    paddingVertical: Espacamento.md,
  },
  ajuda: { color: Cores.textoTerciario, fontSize: Fonte.minuscula },
});
