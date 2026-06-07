/**
 * Reusable permission-request modal.
 *
 * Pattern:
 *   1. User taps a button (e.g. "השתקת התראות בזמן התפילה")
 *   2. If permission already granted → caller does the action immediately.
 *   3. Otherwise → caller opens this modal. The modal explains WHY the
 *      permission is needed and WHAT screen will open. User taps "המשך"
 *      → onContinue() runs the system permission flow.
 *
 * We deliberately do NOT describe the system UI in detail (button names,
 * exact screen layouts) because they vary across Android versions, vendors
 * (Samsung One UI, MIUI, Pixel stock, OnePlus), and locales. The instructions
 * stay generic: "find Chavruta / חברותא in the list and toggle the switch".
 */
import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

export type PermissionExplainerProps = {
  visible: boolean;
  /** Modal title — short, what permission this is. */
  title: string;
  /** 1-2 sentences: why the app needs it. Honest, no fluff. */
  why: string;
  /** What the user will see / do next. Generic, no system-UI specifics. */
  whatNext: string;
  /** Continue button label (default: "המשך לאישור"). */
  continueLabel?: string;
  /** Called when user taps "המשך". Caller invokes the actual system request. */
  onContinue: () => void;
  /** Called when user taps "ביטול" or the backdrop. */
  onCancel: () => void;
};

export function PermissionExplainer({
  visible,
  title,
  why,
  whatNext,
  continueLabel = 'המשך לאישור',
  onContinue,
  onCancel,
}: PermissionExplainerProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            <Text style={[typography.h2, styles.title]}>{title}</Text>
            <Text style={[typography.body, styles.why]}>{why}</Text>
            <View style={styles.divider} />
            <Text style={[typography.bodyBold, styles.whatHeader]}>
              מה יקרה כשתלחץ "המשך":
            </Text>
            <Text style={[typography.body, styles.whatBody]}>{whatNext}</Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.lg }}>
              <Pressable onPress={onContinue} style={[styles.btn, styles.btnPrimary]} hitSlop={6}>
                <Text style={[typography.bodyBold, { color: colors.textInverse }]}>{continueLabel}</Text>
              </Pressable>
              <Pressable onPress={onCancel} style={[styles.btn, styles.btnGhost]} hitSlop={6}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>ביטול</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    backgroundColor: '#0a1f3d',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    maxHeight: '85%',
  },
  title: {
    color: colors.primary,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  why: {
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.md,
  },
  whatHeader: {
    color: colors.primaryDark,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  whatBody: {
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 22,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
