import React, { useState, useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { TOOLS, CATEGORIES, Tool } from '../data/tools';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedIds: string[];
  onToggle: (toolId: string) => void;
};

export function ShortcutPicker({ visible, onClose, selectedIds, onToggle }: Props) {
  const [query, setQuery] = useState('');
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    if (!query.trim()) return TOOLS;
    const q = query.toLowerCase();
    return TOOLS.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }, [query]);

  const byCategory: Record<string, Tool[]> = {};
  for (const t of filtered) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={[typography.bodyBold, { color: colors.primary }]}>סיום</Text>
          </Pressable>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>בחר קיצורי דרך</Text>
          <View style={{ width: 50 }} />
        </View>
        <TextInput
          placeholder="חפש כלי..."
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          textAlign="right"
          placeholderTextColor={colors.textMuted}
        />
        <ScrollView contentContainerStyle={styles.scroll}>
          {CATEGORIES.map((cat) => {
            const list = byCategory[cat.id];
            if (!list || list.length === 0) return null;
            return (
              <View key={cat.id} style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.bodyBold, styles.catTitle]}>{cat.label}</Text>
                {list.map((t) => {
                  const isSelected = selected.has(t.id);
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => onToggle(t.id)}
                      style={[styles.row, isSelected && styles.rowSelected]}
                    >
                      <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{t.title}</Text>
                        <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                          {t.description}
                        </Text>
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                        {isSelected ? <Text style={{ color: colors.textInverse, fontWeight: '700' }}>✓</Text> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  search: {
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 16,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  catTitle: {
    color: colors.primary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
