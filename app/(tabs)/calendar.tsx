import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate, HebrewCalendar, flags } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { BrandBar } from '../../src/components/BrandBar';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { Button } from '../../src/components/Button';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { hebrewDateInfo } from '../../src/data/hebcal';
import {
  CalendarReminder,
  loadReminders,
  addReminder,
  updateReminder,
  deleteReminder,
  remindersForDate,
  dateToISO,
} from '../../src/data/reminders';
import {
  buildHebrewMonth,
  nextHebrewMonth,
  prevHebrewMonth,
  hebrewMonthName,
  hebrewYearString,
} from '../../src/data/hebrewMonth';
import { isSyncSupported, syncAll, pushReminder, deleteRemoteEvent, hasCalendarPermission } from '../../src/services/calendarSync';
import { PermissionExplainer } from '../../src/components/PermissionExplainer';
import { Linking } from 'react-native';

const HEB_WEEKDAYS_SHORT = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
type CellEvent = { desc: string; category: string };
type ViewMode = 'gregorian' | 'hebrew';

function buildGregMonth(year: number, month: number): Array<Array<Date | null>> {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const weeks: Array<Array<Date | null>> = [];
  let week: Array<Date | null> = new Array(first.getDay()).fill(null);
  for (let d = 1; d <= lastDay; d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  while (week.length > 0 && week.length < 7) week.push(null);
  if (week.length === 7) weeks.push(week);
  return weeks;
}

export default function CalendarScreen() {
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  const today = new Date();

  const [viewMode, setViewMode] = useState<ViewMode>('gregorian');
  const [gregCursor, setGregCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const todayHd = new HDate(today);
  const [hebCursor, setHebCursor] = useState<{ hyear: number; hmonth: number }>({
    hyear: todayHd.getFullYear(),
    hmonth: todayHd.getMonth(),
  });
  const [selected, setSelected] = useState<Date>(today);
  const [reminders, setReminders] = useState<CalendarReminder[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<CalendarReminder | null>(null);
  const [calPermModalOpen, setCalPermModalOpen] = useState(false);
  // When true the user just denied calendar perm — show a "fix in Settings"
  // modal instead of the regular explainer.
  const [calPermDenied, setCalPermDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await loadReminders();
      setReminders(list);
    })();
  }, []);

  const refreshReminders = useCallback(async () => {
    setReminders(await loadReminders());
  }, []);

  // Compute month range based on view mode for Hebcal events
  const { rangeStart, rangeEnd, weeks, monthLabel, subLabel } = useMemo(() => {
    if (viewMode === 'gregorian') {
      const ws = buildGregMonth(gregCursor.getFullYear(), gregCursor.getMonth());
      const first = ws.flat().find((d) => d) as Date;
      const last = ws.flat().reverse().find((d) => d) as Date;
      const heb = hebrewDateInfo(gregCursor);
      return {
        rangeStart: new HDate(first),
        rangeEnd: new HDate(last),
        weeks: ws.map((w) => w.map((d) => (d ? { gregDate: d, hday: new HDate(d).getDate() } : null))),
        monthLabel: gregCursor.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
        subLabel: `${heb.monthName} ${heb.yearHe}`,
      };
    } else {
      const m = buildHebrewMonth(hebCursor.hyear, hebCursor.hmonth);
      const first = m.weeks.flat().find((d) => d)!;
      const last = m.weeks.flat().reverse().find((d) => d)!;
      return {
        rangeStart: new HDate(first.gregDate),
        rangeEnd: new HDate(last.gregDate),
        weeks: m.weeks,
        monthLabel: `${m.monthName} ${hebrewYearString(m.hyear)}`,
        subLabel: `${first.gregDate.toLocaleDateString('he-IL', { month: 'long' })} - ${last.gregDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}`,
      };
    }
  }, [viewMode, gregCursor, hebCursor]);

  const eventsByDate = useMemo(() => {
    const evs = HebrewCalendar.calendar({
      start: rangeStart,
      end: rangeEnd,
      il: inIsrael,
      sedrot: true,
      candlelighting: false,
      omer: false,
    });
    const map: Record<string, CellEvent[]> = {};
    for (const ev of evs) {
      const d = ev.getDate().greg();
      const key = dateToISO(d);
      const f = ev.getFlags();
      let category = 'other';
      if (f & flags.CHAG || f & flags.LIGHT_CANDLES || f & flags.LIGHT_CANDLES_TZEIS) category = 'holiday';
      else if (f & flags.ROSH_CHODESH) category = 'rosh';
      else if (f & flags.MAJOR_FAST || f & flags.MINOR_FAST) category = 'fast';
      else if (f & flags.PARSHA_HASHAVUA) category = 'parsha';
      else if (f & flags.MINOR_HOLIDAY) category = 'minor';
      const desc = ev.render('he-x-NoNikud') || ev.renderBrief('he-x-NoNikud') || ev.render('he') || ev.getDesc();
      if (!map[key]) map[key] = [];
      map[key].push({ desc, category });
    }
    return map;
  }, [rangeStart, rangeEnd, inIsrael]);

  const selectedISO = dateToISO(selected);
  const selectedEvents = eventsByDate[selectedISO] ?? [];
  const selectedHebrew = hebrewDateInfo(selected);
  const selectedReminders = remindersForDate(reminders, selectedISO);

  function goPrev() {
    if (viewMode === 'gregorian') {
      setGregCursor(new Date(gregCursor.getFullYear(), gregCursor.getMonth() - 1, 1));
    } else {
      setHebCursor(prevHebrewMonth(hebCursor.hyear, hebCursor.hmonth));
    }
  }
  function goNext() {
    if (viewMode === 'gregorian') {
      setGregCursor(new Date(gregCursor.getFullYear(), gregCursor.getMonth() + 1, 1));
    } else {
      setHebCursor(nextHebrewMonth(hebCursor.hyear, hebCursor.hmonth));
    }
  }
  function goToday() {
    const t = new Date();
    setSelected(t);
    if (viewMode === 'gregorian') {
      setGregCursor(new Date(t.getFullYear(), t.getMonth(), 1));
    } else {
      const hd = new HDate(t);
      setHebCursor({ hyear: hd.getFullYear(), hmonth: hd.getMonth() });
    }
  }

  function openAddReminder() {
    setEditingReminder(null);
    setShowReminderModal(true);
  }
  function openEditReminder(r: CalendarReminder) {
    setEditingReminder(r);
    setShowReminderModal(true);
  }
  async function handleDeleteReminder(r: CalendarReminder) {
    Alert.alert('הסרת תזכורת', `להסיר "${r.title}"?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'הסר',
        style: 'destructive',
        onPress: async () => {
          if (r.syncedEventId) await deleteRemoteEvent(r.syncedEventId);
          await deleteReminder(r.id);
          await refreshReminders();
        },
      },
    ]);
  }
  async function handleSyncAll() {
    if (!isSyncSupported()) {
      Alert.alert('סנכרון יומן', 'סנכרון עם יומן המכשיר זמין רק במכשיר נייד (iOS/Android). באנדרואיד עם חשבון Google מסונכרן - התזכורות יופיעו גם ב-Google Calendar.');
      return;
    }
    // Check permission BEFORE prompting; if missing, show the explainer.
    const granted = await hasCalendarPermission();
    if (!granted) {
      setCalPermDenied(false);
      setCalPermModalOpen(true);
      return;
    }
    await runSync();
  }

  async function runSync() {
    const result = await syncAll();
    if (result.error) {
      // If permission was REVOKED between check and sync, surface the
      // settings-redirect modal so the user knows how to re-grant it.
      if (/הרשאה|permission/i.test(result.error)) {
        setCalPermDenied(true);
        setCalPermModalOpen(true);
        return;
      }
      Alert.alert('שגיאה', result.error);
    } else {
      Alert.alert('סנכרון הושלם', `${result.synced} מתוך ${result.total} תזכורות סונכרנו ליומן המכשיר`);
      await refreshReminders();
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="לוח שנה" subtitle="חודש לועזי/עברי + תזכורות" />

        {/* View mode toggle */}
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => setViewMode('gregorian')}
            style={[styles.modeBtn, viewMode === 'gregorian' && styles.modeBtnActive]}
          >
            <Text style={[typography.bodyBold, { color: viewMode === 'gregorian' ? colors.textInverse : colors.textPrimary }]}>
              לועזי
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('hebrew')}
            style={[styles.modeBtn, viewMode === 'hebrew' && styles.modeBtnActive]}
          >
            <Text style={[typography.bodyBold, { color: viewMode === 'hebrew' ? colors.textInverse : colors.textPrimary }]}>
              עברי
            </Text>
          </Pressable>
        </View>

        <View style={styles.navRow}>
          <Pressable onPress={goPrev} style={styles.navButton}>
            <Text style={[typography.h2, { color: colors.primary }]}>‹</Text>
          </Pressable>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{monthLabel}</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{subLabel}</Text>
            <Pressable onPress={goToday} style={{ marginTop: 4 }}>
              <Text style={[typography.caption, { color: colors.primary }]}>← היום</Text>
            </Pressable>
          </View>
          <Pressable onPress={goNext} style={styles.navButton}>
            <Text style={[typography.h2, { color: colors.primary }]}>›</Text>
          </Pressable>
        </View>

        <View style={styles.weekHeader}>
          {HEB_WEEKDAYS_SHORT.map((d) => (
            <View key={d} style={styles.weekCell}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>{d}</Text>
            </View>
          ))}
        </View>

        <View style={styles.grid}>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => {
                if (!day) return <View key={di} style={[styles.dayCell, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />;
                const key = dateToISO(day.gregDate);
                const evs = eventsByDate[key] ?? [];
                const userRems = remindersForDate(reminders, key);
                const isToday = day.gregDate.toDateString() === today.toDateString();
                const isSelected = day.gregDate.toDateString() === selected.toDateString();
                const isHoliday = evs.some((e) => e.category === 'holiday');
                const primary = viewMode === 'hebrew' ? day.hday : day.gregDate.getDate();
                const secondary =
                  viewMode === 'hebrew'
                    ? day.gregDate.getDate()
                    : new HDate(day.gregDate).renderGematriya().split(' ')[0];
                return (
                  <Pressable
                    key={di}
                    onPress={() => setSelected(day.gregDate)}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      isToday && !isSelected && styles.dayCellToday,
                      isHoliday && !isSelected && styles.dayCellHoliday,
                    ]}
                  >
                    <Text style={[typography.small, styles.dayNum, isSelected && { color: colors.textInverse }]}>
                      {primary}
                    </Text>
                    <Text style={[typography.caption, styles.dayHeb, isSelected && { color: colors.textInverse, opacity: 0.85 }]}>
                      {secondary}
                    </Text>
                    <View style={{ flexDirection: 'row-reverse', gap: 2, marginTop: 2 }}>
                      {evs.length > 0 && (
                        <View style={[styles.eventDot, isSelected && { backgroundColor: colors.textInverse }]} />
                      )}
                      {userRems.length > 0 && (
                        <View style={[styles.userDot, isSelected && { backgroundColor: colors.textInverse }]} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.md }}>
          <Card>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>{selectedHebrew.gematria}</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
              {selected.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {selectedEvents.length === 0 && selectedReminders.length === 0 ? (
                <Text style={[typography.body, { color: colors.textMuted }]}>אין אירועים מיוחדים</Text>
              ) : (
                <>
                  {selectedEvents.map((ev, i) => {
                    let tone: 'primary' | 'accent' | 'warning' | 'info' | 'default' = 'default';
                    if (ev.category === 'holiday') tone = 'accent';
                    else if (ev.category === 'fast') tone = 'warning';
                    else if (ev.category === 'rosh') tone = 'primary';
                    else if (ev.category === 'parsha') tone = 'info';
                    return <Pill key={i} label={ev.desc} tone={tone} />;
                  })}
                </>
              )}
            </View>
          </Card>

          <Card>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>תזכורות שלי</Text>
              <Pressable onPress={openAddReminder} hitSlop={10}>
                <Text style={[typography.bodyBold, { color: colors.primary }]}>+ הוסף</Text>
              </Pressable>
            </View>
            {selectedReminders.length === 0 ? (
              <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>אין תזכורות לתאריך זה</Text>
            ) : (
              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                {selectedReminders.map((r) => (
                  <Pressable key={r.id} onPress={() => openEditReminder(r)} style={styles.remRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{r.title}</Text>
                        {r.time ? <Text style={[typography.caption, { color: colors.primary }]}>{r.time}</Text> : null}
                        {r.syncedEventId ? <Text style={[typography.caption, { color: colors.success }]}>✓ סונכרן</Text> : null}
                      </View>
                      {r.notes ? (
                        <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{r.notes}</Text>
                      ) : null}
                    </View>
                    <Pressable onPress={() => handleDeleteReminder(r)} hitSlop={10}>
                      <Text style={[typography.bodyBold, { color: colors.danger }]}>✕</Text>
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )}
          </Card>

          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button
              label="🔄 סנכרן ליומן המכשיר"
              onPress={handleSyncAll}
              variant="secondary"
              style={{ flexGrow: 1, minWidth: 200 }}
            />
          </View>
          {!isSyncSupported() && (
            <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
              סנכרון יומן זמין במכשיר נייד בלבד · באנדרואיד עם Google Calendar מסונכרן זה יעבור גם ל-Google
            </Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ReminderModal
        visible={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        dateISO={selectedISO}
        editing={editingReminder}
        onSaved={refreshReminders}
      />

      {/* Calendar permission explainer — shown before any system prompt so
          the user knows WHY the calendar dialog is about to appear. Two
          modes: first-time ask (default) and re-grant from settings (after
          a prior denial). */}
      <PermissionExplainer
        visible={calPermModalOpen}
        title="📅 גישה ליומן המכשיר"
        why={
          'כדי שתזכורות שתסמן כאן יופיעו גם ביומן הטלפון (ו-Google Calendar אם מסונכרן), ' +
          'חברותא צריכה גישת קריאה+כתיבה ליומן.\n\n' +
          'הנתונים נשארים במכשיר שלך — שום דבר לא נשלח לחברותא או לשרת אחר.'
        }
        whatNext={
          calPermDenied
            ? 'בעבר ביטלת את ההרשאה. יפתח דף האפליקציה בהגדרות. שם: "הרשאות" → "יומן" → "אפשר".'
            : 'תוצג בקשת מערכת לאישור. לחץ "אפשר" — אחרי האישור הסנכרון יתחיל אוטומטית.'
        }
        onContinue={async () => {
          setCalPermModalOpen(false);
          if (calPermDenied) {
            // User previously denied → can't re-prompt; must go to settings.
            try { await Linking.openSettings(); } catch {}
            return;
          }
          await runSync();
        }}
        onCancel={() => setCalPermModalOpen(false)}
      />
    </SafeAreaView>
  );
}

function ReminderModal({
  visible,
  onClose,
  dateISO,
  editing,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  dateISO: string;
  editing: CalendarReminder | null;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      setTitle(editing?.title ?? '');
      setTime(editing?.time ?? '');
      setNotes(editing?.notes ?? '');
    }
  }, [visible, editing]);

  async function save() {
    if (!title.trim()) {
      Alert.alert('שגיאה', 'נא הזן כותרת');
      return;
    }
    const cleanTime = time.trim() && /^\d{1,2}:\d{2}$/.test(time.trim()) ? time.trim() : undefined;
    try {
      if (editing) {
        await updateReminder(editing.id, { title: title.trim(), time: cleanTime, notes: notes.trim() || undefined });
      } else {
        const newR = await addReminder({ dateISO, title: title.trim(), time: cleanTime, notes: notes.trim() || undefined });
        // Auto-push to device calendar if supported (non-fatal if it fails)
        if (isSyncSupported()) {
          try {
            const eventId = await pushReminder(newR);
            if (eventId) await updateReminder(newR.id, { syncedEventId: eventId });
          } catch (e: any) {
            console.warn('Calendar sync failed (non-fatal):', e?.message);
          }
        }
      }
      await onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert('שגיאה בשמירה', String(e?.message ?? e));
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={[typography.bodyBold, { color: colors.primary }]}>ביטול</Text>
          </Pressable>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>{editing ? 'עריכת תזכורת' : 'תזכורת חדשה'}</Text>
          <Pressable onPress={save} hitSlop={10}>
            <Text style={[typography.bodyBold, { color: colors.primary }]}>שמור</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <View>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>כותרת</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="למשל: יום הולדת של דוד"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              textAlign="right"
            />
          </View>
          <View>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>שעה (אופציונלי)</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="08:30"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              keyboardType="numbers-and-punctuation"
              textAlign="right"
            />
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>אם תשאיר ריק - אירוע יום שלם</Text>
          </View>
          <View>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>הערות (אופציונלי)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="פרטים נוספים..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              textAlign="right"
            />
          </View>
          {isSyncSupported() && (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              💡 התזכורת תיווסף ליומן המכשיר אוטומטית. אם Google Calendar מסונכרן - היא תופיע גם שם.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xl },
  modeToggle: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  navRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekHeader: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  grid: { paddingHorizontal: spacing.md },
  weekRow: { flexDirection: 'row-reverse' },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCellToday: { borderColor: colors.primary, borderWidth: 2 },
  dayCellSelected: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  dayCellHoliday: { backgroundColor: '#FBF1DD' },
  dayNum: { color: colors.textPrimary, fontWeight: '700' },
  dayHeb: { color: colors.textMuted, marginTop: 1, fontSize: 10 },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  userDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accentDark,
  },
  remRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
  },
});
