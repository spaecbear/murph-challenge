import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { PartitionMode, PARTITION_MODES } from '../models/WorkoutConfig';
import { useWorkout } from '../state/WorkoutContext';

const MODES: PartitionMode[] = ['asRxd', 'twentyRounds', 'tenRounds'];

export function SetupScreen() {
  const { startWorkout } = useWorkout();

  const today = new Date();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [date, setDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [partitionMode, setPartitionMode] = useState<PartitionMode>('asRxd');
  const [hasVest, setHasVest] = useState(false);
  const [vestWeight, setVestWeight] = useState<20 | 14>(20);

  function formatDate(d: Date): string {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function handleStart() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    startWorkout({
      athleteName: name.trim(),
      date: date.toISOString(),
      notes: notes.trim(),
      partitionMode,
      hasVest,
      vestWeight,
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MURPH</Text>
          <Text style={styles.headerSub}>CHALLENGE</Text>
          <View style={styles.headerDivider} />
        </View>

        <Text style={styles.sectionLabel}>ATHLETE SETUP</Text>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NAME</Text>
          <TextInput
            style={[styles.input, nameError && styles.inputError]}
            value={name}
            onChangeText={(v) => { setName(v); if (v.trim()) setNameError(false); }}
            placeholder="Full name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {nameError && (
            <Text style={styles.fieldError}>Name is required to start.</Text>
          )}
        </View>

        {/* Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>DATE</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'compact' : 'default'}
              onChange={(_event, selected) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selected) setDate(selected);
              }}
              style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
            />
          )}
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Conditions, goals, remarks..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Partition Mode */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionLabel}>PARTITION MODE</Text>

        <View style={styles.modeContainer}>
          {MODES.map((mode) => {
            const data = PARTITION_MODES[mode];
            const selected = partitionMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.modeCard, selected && styles.modeCardSelected]}
                onPress={() => setPartitionMode(mode)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeName, selected && styles.modeNameSelected]}>
                  {data.label.toUpperCase()}
                </Text>
                <Text style={[styles.modeDesc, selected && styles.modeDescSelected]}>
                  {data.description}
                </Text>
                {selected && <View style={styles.modeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Vest */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionLabel}>EQUIPMENT</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>WEIGHT VEST</Text>
          <Switch
            value={hasVest}
            onValueChange={setHasVest}
            trackColor={{ false: colors.surfaceElevated, true: colors.accent }}
            thumbColor={colors.textPrimary}
          />
        </View>

        {hasVest && (
          <View style={styles.vestWeightRow}>
            <TouchableOpacity
              style={[styles.weightBtn, vestWeight === 20 && styles.weightBtnSelected]}
              onPress={() => setVestWeight(20)}
            >
              <Text style={[styles.weightBtnText, vestWeight === 20 && styles.weightBtnTextSelected]}>
                MEN — 20 LB
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.weightBtn, vestWeight === 14 && styles.weightBtnSelected]}
              onPress={() => setVestWeight(14)}
            >
              <Text style={[styles.weightBtnText, vestWeight === 14 && styles.weightBtnTextSelected]}>
                WOMEN — 14 LB
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Workout Overview */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionLabel}>THE WORKOUT</Text>

        <View style={styles.overviewCard}>
          <WorkoutOverviewRow label="1" exercise="MILE RUN" />
          <View style={styles.overviewDivider} />
          <WorkoutOverviewRow label="100" exercise="PULL-UPS" />
          <WorkoutOverviewRow label="200" exercise="PUSH-UPS" />
          <WorkoutOverviewRow label="300" exercise="AIR SQUATS" />
          <View style={styles.overviewDivider} />
          <WorkoutOverviewRow label="1" exercise="MILE RUN" />
          {hasVest && (
            <Text style={styles.overviewVest}>
              {`${vestWeight} LB WEIGHT VEST`}
            </Text>
          )}
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startButtonText}>START WORKOUT</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function WorkoutOverviewRow({ label, exercise }: { label: string; exercise: string }) {
  return (
    <View style={styles.overviewRow}>
      <Text style={styles.overviewNum}>{label}</Text>
      <Text style={styles.overviewExercise}>{exercise}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },

  header: { alignItems: 'center', paddingVertical: 24 },
  headerTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 8,
  },
  headerSub: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 6,
    marginTop: -4,
  },
  headerDivider: {
    height: 2,
    width: 48,
    backgroundColor: colors.accent,
    marginTop: 16,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 3,
    marginBottom: 12,
    marginTop: 4,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 20,
  },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    justifyContent: 'center',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  fieldError: {
    fontSize: 12,
    color: '#FF4444',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  inputMulti: {
    minHeight: 72,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  dateText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  iosPicker: {
    marginTop: 8,
  },

  modeContainer: { gap: 8 },
  modeCard: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modeCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceVariant,
  },
  modeName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    flex: 1,
  },
  modeNameSelected: { color: colors.textPrimary },
  modeDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  modeDescSelected: { color: colors.accent },
  modeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginLeft: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 2,
  },

  vestWeightRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  weightBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  weightBtnSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceVariant,
  },
  weightBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  weightBtnTextSelected: { color: colors.accent },

  overviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  overviewNum: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.accent,
    minWidth: 56,
    textAlign: 'right',
    marginRight: 16,
  },
  overviewExercise: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  overviewDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 2,
  },
  overviewVest: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 2,
    textAlign: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: 2,
  },

  startButton: {
    backgroundColor: colors.accent,
    borderRadius: 4,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 3,
  },
});
