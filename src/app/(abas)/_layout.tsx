import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';

import { Cores, Fonte } from '@/constants/tema';

type NomeIcone = keyof typeof Ionicons.glyphMap;

/** Descricao das cinco abas, na ordem em que aparecem na barra inferior. */
const abas: { nome: string; rotulo: string; icone: NomeIcone }[] = [
  { nome: 'index', rotulo: 'Inicio', icone: 'home' },
  { nome: 'busca', rotulo: 'Buscar', icone: 'search' },
  { nome: 'simulcast', rotulo: 'Simulcast', icone: 'calendar' },
  { nome: 'lista', rotulo: 'Minha lista', icone: 'bookmark' },
  { nome: 'perfil', rotulo: 'Perfil', icone: 'person' },
];

export default function LayoutAbas() {
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
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
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
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? aba.icone : (`${aba.icone}-outline` as NomeIcone)}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
