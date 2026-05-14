import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useWorkout } from '../state/WorkoutContext';
import { PARTITION_MODES } from '../models/WorkoutConfig';
import { formatDuration } from '../utils/timeFormatter';
import { exportResults } from '../utils/exportUtils';

export function ResultsScreen() {
  const { state, reset } = useWorkout();
  const { config, elapsed, pullUps, pushUps, squats, run1EndTime, exercisesEndTime, run2EndTime } = state;
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!config || run1EndTime === null || exercisesEndTime === null || run2EndTime === null) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No results available.</Text>
          <TouchableOpacity style={styles.resetButton} onPress={reset}>
            <Text style={styles.resetButtonText}>START OVER</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const run1Duration = run1EndTime;
  const middleDuration = exercisesEndTime - run1EndTime;
  const run2Duration = run2EndTime - exercisesEndTime;
  const totalDuration = run2EndTime;

  const modeData = PARTITION_MODES[config.partitionMode];
  const vestStr = config.hasVest ? `${config.vestWeight} LB VEST` : 'NO VEST';
  const dateStr = new Date(config.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  async function handleExport() {
    setExporting(true);
    setExportError(false);
    try {
      await exportResults(config!, {
        run1EndTime: run1EndTime!,
        exercisesEndTime: exercisesEndTime!,
        run2EndTime: run2EndTime!,
      });
    } catch (_err) {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>MURPH CHALLENGE</Text>
          <Text style={styles.headerTitle}>RESULTS</Text>
          <View style={styles.headerBar} />
        </View>

        {/* Athlete info */}
        <View style={styles.athleteCard}>
          <Text style={styles.athleteName}>{config.athleteName.toUpperCase()}</Text>
          <View style={styles.athleteMeta}>
            <MetaItem label="DATE" value={dateStr} />
            <View style={styles.metaDivider} />
            <MetaItem label="MODE" value={`${modeData.label}`} />
            <View style={styles.metaDivider} />
            <MetaItem label="VEST" value={vestStr} />
          </View>
          {config.notes.trim() !== '' && (
            <View style={styles.notesRow}>
              <Text style={styles.notesLabel}>NOTES</Text>
              <Text style={styles.notesText}>{config.notes.trim()}</Text>
            </View>
          )}
        </View>

        {/* Total time — hero stat */}
        <View style={styles.totalTimeCard}>
          <Text style={styles.totalTimeLabel}>TOTAL TIME</Text>
          <Text style={styles.totalTimeValue}>{formatDuration(totalDuration)}</Text>
        </View>

        {/* Splits */}
        <View style={styles.splitsCard}>
          <Text style={styles.splitsHeader}>SPLITS</Text>
          <SplitRow
            label="MILE RUN #1"
            start={0}
            end={run1EndTime}
            duration={run1Duration}
          />
          <View style={styles.splitDivider} />
          <SplitRow
            label="MIDDLE SECTION"
            sublabel={`${pullUps} pull / ${pushUps} push / ${squats} squat`}
            start={run1EndTime}
            end={exercisesEndTime}
            duration={middleDuration}
          />
          <View style={styles.splitDivider} />
          <SplitRow
            label="MILE RUN #2"
            start={exercisesEndTime}
            end={run2EndTime}
            duration={run2Duration}
          />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.exportButtonLoading]}
          onPress={handleExport}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.exportButtonText}>EXPORT RESULTS</Text>
          )}
        </TouchableOpacity>
        {exportError && (
          <Text style={styles.exportErrorText}>Export failed. Please try again.</Text>
        )}

        <TouchableOpacity
          style={[styles.resetButton, confirmReset && styles.resetButtonPrimed]}
          onPress={confirmReset ? reset : () => setConfirmReset(true)}
          activeOpacity={0.75}
        >
          <Text style={[styles.resetButtonText, confirmReset && styles.resetButtonTextPrimed]}>
            {confirmReset ? 'TAP AGAIN TO CONFIRM RESET' : 'RESET — START OVER'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={metaStyles.item}>
      <Text style={metaStyles.label}>{label}</Text>
      <Text style={metaStyles.value}>{value}</Text>
    </View>
  );
}

function SplitRow({
  label,
  sublabel,
  start,
  end,
  duration,
}: {
  label: string;
  sublabel?: string;
  start: number;
  end: number;
  duration: number;
}) {
  return (
    <View style={splitStyles.row}>
      <View style={splitStyles.left}>
        <Text style={splitStyles.label}>{label}</Text>
        {sublabel && <Text style={splitStyles.sublabel}>{sublabel}</Text>}
        <Text style={splitStyles.range}>
          {formatDuration(start)} – {formatDuration(end)}
        </Text>
      </View>
      <Text style={splitStyles.duration}>{formatDuration(duration)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 24, paddingTop: 16 },

  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  errorText: { color: colors.textSecondary, fontSize: 16 },

  header: { alignItems: 'center', paddingVertical: 28 },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 4,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 6,
  },
  headerBar: {
    height: 2,
    width: 48,
    backgroundColor: colors.accent,
    marginTop: 14,
  },

  athleteCard: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    padding: 20,
    marginBottom: 12,
  },
  athleteName: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
    marginBottom: 16,
  },
  athleteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.divider,
    marginHorizontal: 12,
  },
  notesRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  totalTimeCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    padding: 20,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  totalTimeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 3,
    marginBottom: 6,
  },
  totalTimeValue: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -2,
  },

  splitsCard: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    padding: 20,
    marginBottom: 24,
  },
  splitsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 3,
    marginBottom: 16,
  },
  splitDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },

  exportButton: {
    backgroundColor: colors.accent,
    borderRadius: 4,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  exportButtonLoading: { opacity: 0.7 },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 12,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  exportErrorText: {
    fontSize: 12,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  resetButtonPrimed: {
    borderColor: '#CC2222',
    backgroundColor: 'rgba(204, 34, 34, 0.08)',
  },
  resetButtonTextPrimed: {
    color: '#CC2222',
  },
});

const metaStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center' },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

const splitStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flex: 1 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  sublabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  range: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  duration: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
});
