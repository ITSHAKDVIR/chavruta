import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { Icon, IconName } from '../../src/components/Icon';

function TabIcon({ icon, focused }: { icon: IconName; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Icon
        name={icon}
        size={focused ? 26 : 22}
        color={focused ? colors.primary : colors.textMuted}
        strokeWidth={focused ? 2 : 1.75}
      />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Android gesture navigation needs extra bottom padding so the tabs aren't
  // hidden behind the system nav bar. iOS uses safe-area for home indicator.
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          // Solid navy backstop so the tab bar stays readable over any screen.
          backgroundColor: '#0a1f3d',
          borderTopColor: colors.glassBorder,
          height: 60 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
          // We declare tabs in reverse order (settings → ... → home) below,
          // so default LTR row puts home on the RIGHT and settings on the LEFT
          // — matching Hebrew/RTL convention without depending on I18nManager.
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontSize: 11,            // smaller so "הגדרות" / "לוח שנה" fit
          textAlign: 'center',
          paddingHorizontal: 0,    // no extra padding squeezing the text
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,    // tabs share screen width evenly
        },
      }}
    >
      {/* Declared in REVERSE visual order: first child renders LEFT under
          default flex 'row'. So settings (first) goes LEFT, home (last) goes
          RIGHT — matching Hebrew RTL reading order. */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'הגדרות',
          tabBarIcon: ({ focused }) => <TabIcon icon="settings" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'כלים',
          tabBarIcon: ({ focused }) => <TabIcon icon="wrench" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'לוח שנה',
          tabBarIcon: ({ focused }) => <TabIcon icon="calendar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'לימוד',
          tabBarIcon: ({ focused }) => <TabIcon icon="book" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'בית',
          tabBarIcon: ({ focused }) => <TabIcon icon="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
