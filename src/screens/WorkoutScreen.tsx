import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { RadialProgressRing } from '../components/RadialProgressRing';
import { WorkoutPhase, ExerciseKey, useWorkout } from '../state/WorkoutContext';
import { TOTAL_PULLUPS, TOTAL_PUSHUPS, TOTAL_SQUATS, PARTITION_MODES } from '../models/WorkoutConfig';
import { formatDuration } from '../utils/timeFormatter';

type ExercisePhase = 'pullUps' | 'pushUps' | 'squats';
const EXERCISE_PHASES: ExercisePhase[] = ['pullUps', 'pushUps', 'squats'];

const PHASE_LABELS: Record<WorkoutPhase, string> = {
  run1: 'RUN 1',
  pullUps: 'PULL-UPS',
  pushUps: 'PUSH-UPS',
  squats: 'SQUATS',
  run2: 'RUN 2',
  done: 'DONE',
};

const EXERCISE_TOTALS: Record<ExercisePhase, number> = {
  pullUps: TOTAL_PULLUPS,
  pushUps: TOTAL_PUSHUPS,
  squats: TOTAL_SQUATS,
};

const EXERCISE_KEYS: Record<ExercisePhase, ExerciseKey> = {
  pullUps: 'pullUps',
  pushUps: 'pushUps',
  squats: 'squats',
};

export function WorkoutScreen() {
  const { state, toggleTimer, completeRun1, setPhase, addReps, completeRun2, reset, overallProgress, completedRounds } =
    useWorkout();
  const { elapsed, isRunning, phase, pullUps, pushUps, squats, config } = state;

  const progressPct = Math.round(overallProgress * 100);

  function handleBack() {
    Alert.alert(
      'End Workout',
      'Return to setup? Your current workout will be lost.',
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'End Workout', style: 'destructive', onPress: reset },
      ]
    );
  }

  function handleCompleteRun() {
    if (phase === 'run1') {
      completeRun1();
    } else if (phase === 'run2') {
      completeRun2();
    }
  }

  const repCounts: Record<ExercisePhase, number> = {
    pullUps,
    pushUps,
    squats,
  };

  const isExercisePhase = EXERCISE_PHASES.includes(phase as ExercisePhase);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backText}>END</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MURPH</Text>
        <TouchableOpacity
          onPress={toggleTimer}
          style={[styles.timerToggle, isRunning ? styles.timerTogglePause : styles.timerToggleResume]}
        >
          <Text style={styles.timerToggleText}>{isRunning ? 'PAUSE' : 'RESUME'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer */}
        <View style={styles.timerBlock}>
          <Text style={[styles.timerText, !isRunning && styles.timerTextPaused]}>
            {formatDuration(elapsed)}
          </Text>
          {!isRunning && (
            <Text style={styles.pausedLabel}>PAUSED</Text>
          )}
        </View>

        {/* Radial Ring */}
        <View style={styles.ringContainer}>
          <RadialProgressRing
            progress={overallProgress}
            size={170}
            strokeWidth={10}
            centerLabel={`${progressPct}%`}
            subLabel="COMPLETE"
          />
        </View>

        {/* Phase Tab Bar */}
        <PhaseTabs
          currentPhase={phase}
          pullProgress={pullUps / TOTAL_PULLUPS}
          pushProgress={pushUps / TOTAL_PUSHUPS}
          squatProgress={squats / TOTAL_SQUATS}
          onSelectPhase={setPhase}
        />

        <View style={styles.phaseContent}>
          {(phase === 'run1' || phase === 'run2') && (
            <RunPhase
              isRun1={phase === 'run1'}
              onComplete={handleCompleteRun}
              isTimerRunning={isRunning}
              onStartTimer={toggleTimer}
            />
          )}

          {isExercisePhase && (
            <ExercisePhase
              activePhase={phase as ExercisePhase}
              repCounts={repCounts}
              onAddReps={addReps}
              completedRounds={completedRounds}
              totalRounds={config?.partitionMode !== 'asRxd' ? PARTITION_MODES[config!.partitionMode].totalRounds : 0}
              isPartitioned={config?.partitionMode !== 'asRxd'}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Phase Tab Bar ──────────────────────────────────────────────

interface PhaseTabsProps {
  currentPhase: WorkoutPhase;
  pullProgress: number;
  pushProgress: number;
  squatProgress: number;
  onSelectPhase: (phase: WorkoutPhase) => void;
}

function PhaseTabs({ currentPhase, pullProgress, pushProgress, squatProgress, onSelectPhase }: PhaseTabsProps) {
  const tabs: { key: WorkoutPhase; label: string; progress?: number }[] = [
    { key: 'run1', label: 'RUN 1' },
    { key: 'pullUps', label: 'PULL', progress: pullProgress },
    { key: 'pushUps', label: 'PUSH', progress: pushProgress },
    { key: 'squats', label: 'SQUAT', progress: squatProgress },
    { key: 'run2', label: 'RUN 2' },
  ];

  const EXERCISE_PHASES: WorkoutPhase[] = ['pullUps', 'pushUps', 'squats'];
  const isExerciseActive = EXERCISE_PHASES.includes(currentPhase);

  // A phase is "reachable" if we've progressed past or are currently on it
  const phaseOrder: WorkoutPhase[] = ['run1', 'pullUps', 'pushUps', 'squats', 'run2', 'done'];
  const currentIdx = phaseOrder.indexOf(currentPhase);

  function isReached(phase: WorkoutPhase) {
    return phaseOrder.indexOf(phase) <= currentIdx;
  }

  return (
    <View style={tabStyles.container}>
      {tabs.map((tab) => {
        const isActive = currentPhase === tab.key;
        const reached = isReached(tab.key);
        const tappable = isExerciseActive && EXERCISE_PHASES.includes(tab.key);
        const isDone = reached && !isActive;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              tabStyles.tab,
              isActive && tabStyles.tabActive,
              !reached && tabStyles.tabDisabled,
            ]}
            onPress={() => tappable && onSelectPhase(tab.key)}
            activeOpacity={tappable ? 0.7 : 1}
          >
            <Text
              style={[
                tabStyles.tabLabel,
                isActive && tabStyles.tabLabelActive,
                isDone && tabStyles.tabLabelDone,
                !reached && tabStyles.tabLabelDisabled,
              ]}
            >
              {tab.label}
            </Text>
            {tab.progress !== undefined && (
              <View style={tabStyles.miniBarTrack}>
                <View
                  style={[
                    tabStyles.miniBarFill,
                    { width: `${Math.round(tab.progress * 100)}%` as any },
                    !reached && tabStyles.miniBarDisabled,
                  ]}
                />
              </View>
            )}
            {isActive && <View style={tabStyles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Run Phase ─────────────────────────────────────────────────

interface RunPhaseProps {
  isRun1: boolean;
  onComplete: () => void;
  isTimerRunning: boolean;
  onStartTimer: () => void;
}

function RunPhase({ isRun1, onComplete, isTimerRunning, onStartTimer }: RunPhaseProps) {
  return (
    <View style={runStyles.container}>
      <Text style={runStyles.label}>{isRun1 ? 'MILE RUN #1' : 'MILE RUN #2'}</Text>
      <Text style={runStyles.desc}>1 MILE</Text>
      {isRun1 && !isTimerRunning && (
        <TouchableOpacity style={runStyles.startTimerBtn} onPress={onStartTimer}>
          <Text style={runStyles.startTimerText}>START TIMER</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[runStyles.completeBtn, !isTimerRunning && isRun1 && runStyles.completeBtnDisabled]}
        onPress={onComplete}
        activeOpacity={0.85}
      >
        <Text style={runStyles.completeBtnText}>RUN COMPLETE</Text>
      </TouchableOpacity>
      <Text style={runStyles.hint}>
        {isRun1
          ? 'Tap when you finish the first mile'
          : 'Tap when you finish the final mile'}
      </Text>
    </View>
  );
}

// ── Exercise Phase ────────────────────────────────────────────

interface ExercisePhaseProps {
  activePhase: ExercisePhase;
  repCounts: Record<ExercisePhase, number>;
  onAddReps: (exercise: ExerciseKey, count: number) => void;
  completedRounds: number;
  totalRounds: number;
  isPartitioned: boolean;
}

function ExercisePhase({
  activePhase,
  repCounts,
  onAddReps,
  completedRounds,
  totalRounds,
  isPartitioned,
}: ExercisePhaseProps) {
  const total = EXERCISE_TOTALS[activePhase];
  const count = repCounts[activePhase];
  const progressFrac = count / total;

  const exerciseLabel = PHASE_LABELS[activePhase];
  const exerciseKey = EXERCISE_KEYS[activePhase];

  return (
    <View style={exStyles.container}>
      {/* Mini summary row */}
      <View style={exStyles.summaryRow}>
        {EXERCISE_PHASES.map((ep) => {
          const frac = repCounts[ep] / EXERCISE_TOTALS[ep];
          const isActive = ep === activePhase;
          return (
            <View key={ep} style={exStyles.summaryItem}>
              <Text style={[exStyles.summaryLabel, isActive && exStyles.summaryLabelActive]}>
                {ep === 'pullUps' ? 'PULL' : ep === 'pushUps' ? 'PUSH' : 'SQUAT'}
              </Text>
              <Text style={[exStyles.summaryCount, isActive && exStyles.summaryCountActive]}>
                {repCounts[ep]}/{EXERCISE_TOTALS[ep]}
              </Text>
              <View style={exStyles.summaryBarTrack}>
                <View
                  style={[exStyles.summaryBarFill, { width: `${frac * 100}%` as any }, isActive && exStyles.summaryBarActive]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={exStyles.divider} />

      {/* Active exercise tracker */}
      <Text style={exStyles.exerciseLabel}>{exerciseLabel}</Text>

      <View style={exStyles.countRow}>
        <Text style={exStyles.countCurrent}>{count}</Text>
        <Text style={exStyles.countSep}> / </Text>
        <Text style={exStyles.countTotal}>{total}</Text>
      </View>

      {/* Progress bar */}
      <View style={exStyles.progressTrack}>
        <View style={[exStyles.progressFill, { width: `${progressFrac * 100}%` as any }]} />
      </View>
      <Text style={exStyles.progressPct}>{Math.round(progressFrac * 100)}% COMPLETE</Text>

      {/* Rep buttons */}
      <View style={exStyles.repButtons}>
        <RepButton label="-1" onPress={() => onAddReps(exerciseKey, -1)} variant="minus" />
        <RepButton label="+1" onPress={() => onAddReps(exerciseKey, 1)} />
        <RepButton label="+5" onPress={() => onAddReps(exerciseKey, 5)} />
        <RepButton label="+10" onPress={() => onAddReps(exerciseKey, 10)} variant="large" />
      </View>

      {/* Round counter */}
      {isPartitioned && totalRounds > 0 && (
        <View style={exStyles.roundContainer}>
          <Text style={exStyles.roundLabel}>ROUND</Text>
          <Text style={exStyles.roundCount}>
            {completedRounds} <Text style={exStyles.roundTotal}>/ {totalRounds}</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

function RepButton({
  label,
  onPress,
  variant,
}: {
  label: string;
  onPress: () => void;
  variant?: 'minus' | 'large';
}) {
  return (
    <TouchableOpacity
      style={[
        repStyles.btn,
        variant === 'minus' && repStyles.btnMinus,
        variant === 'large' && repStyles.btnLarge,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text
        style={[
          repStyles.label,
          variant === 'minus' && repStyles.labelMinus,
          variant === 'large' && repStyles.labelLarge,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backBtn: { minWidth: 40 },
  backText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 5,
  },
  timerToggle: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 3,
    minWidth: 72,
    alignItems: 'center',
  },
  timerTogglePause: { backgroundColor: colors.surfaceElevated },
  timerToggleResume: { backgroundColor: colors.accent },
  timerToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  timerBlock: { alignItems: 'center', paddingTop: 28, paddingBottom: 8 },
  timerText: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timerTextPaused: { color: colors.textSecondary },
  pausedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 4,
    marginTop: 4,
  },
  ringContainer: { alignItems: 'center', paddingVertical: 16 },
  phaseContent: { paddingHorizontal: 20, paddingTop: 4 },
});

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    position: 'relative',
  },
  tabActive: { backgroundColor: colors.surfaceVariant },
  tabDisabled: { opacity: 0.35 },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.2,
  },
  tabLabelActive: { color: colors.accent },
  tabLabelDone: { color: colors.textPrimary },
  tabLabelDisabled: { color: colors.textMuted },
  miniBarTrack: {
    height: 2,
    backgroundColor: colors.progressTrack,
    borderRadius: 1,
    marginTop: 4,
    width: '80%',
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
  miniBarDisabled: { backgroundColor: colors.textMuted },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
});

const runStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 3,
    marginBottom: 6,
  },
  desc: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
    marginBottom: 32,
  },
  startTimerBtn: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  startTimerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  completeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 4,
    paddingHorizontal: 48,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
  },
  completeBtnDisabled: { opacity: 0.5 },
  completeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 16,
    letterSpacing: 0.5,
  },
});

const exStyles = StyleSheet.create({
  container: { paddingTop: 16 },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 4,
    padding: 16,
    gap: 8,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  summaryLabelActive: { color: colors.accent },
  summaryCount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  summaryCountActive: { color: colors.textPrimary },
  summaryBarTrack: {
    height: 3,
    backgroundColor: colors.progressTrack,
    borderRadius: 2,
    width: '90%',
    overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%',
    backgroundColor: colors.textMuted,
    borderRadius: 2,
  },
  summaryBarActive: { backgroundColor: colors.accent },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 20 },
  exerciseLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 12,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  countCurrent: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -2,
  },
  countSep: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.textMuted,
  },
  countTotal: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.progressTrack,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  progressPct: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 24,
  },
  repButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  roundContainer: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  roundLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 3,
  },
  roundCount: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  roundTotal: {
    fontSize: 20,
    fontWeight: '400',
    color: colors.textSecondary,
  },
});

const repStyles = StyleSheet.create({
  btn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  btnMinus: {
    backgroundColor: colors.background,
    borderColor: colors.surfaceElevated,
    flex: 0,
    width: 56,
  },
  btnLarge: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    flex: 1.3,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  labelMinus: { color: colors.textMuted },
  labelLarge: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
});
