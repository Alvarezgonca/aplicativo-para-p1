import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';

import { AlturaBarraAbas, Cores, Fonte } from '@/constants/tema';
import { useAlturaBarraAbas } from '@/hooks/use-altura-barra-abas';

type NomeIcone = keyof typeof Ionicons.glyphMap;

/** Descricao das cinco abas, na ordem em que aparecem na barra inferior. */
const abas: { nome: string; rotulo: string; icone: NomeIcone }[] = [
  { nome: 'index', rotulo: 'Início', icone: 'home' },
  { nome: 'busca', rotulo: 'Buscar', icone: 'search' },
  { nome: 'simulcast', rotulo: 'Simulcast', icone: 'calendar' },
  { nome: 'lista', rotulo: 'Lista', icone: 'bookmark' },
  { nome: 'perfil', rotulo: 'Perfil', icone: 'person' },
];

export default function LayoutAbas() {
  const alturaBarra = useAlturaBarraAbas();
  const recuoInferior = alturaBarra - AlturaBarraAbas;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Cores.marca,
        tabBarInactiveTintColor: Cores.textoTerciario,
        tabBarStyle: {
          backgroundColor: Cores.superficie,
          borderTopColor: Cores.divisoria,
          borderTopWidth: 1,
          // A altura soma o recuo do sistema para que os icones nao fiquem
          // sob a barra de navegacao do aparelho.
          height: alturaBarra,
          paddingTop: 6,
          paddingBottom: recuoInferior + 8,
        },
        tabBarLabelStyle: {
          fontSize: Fonte.minuscula,
          fontWeight: '600',
        },
      }}>
      {abas.map((aba) => (
        <Tabs.Screen
          key={aba.nome}
          name={aba.nome}
          options={{
            title: aba.rotulo,
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? aba.icone : (`${aba.icone}-outline` as NomeIcone)}
                size={22}
                color={focused ? Cores.marca : Cores.textoTerciario}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
