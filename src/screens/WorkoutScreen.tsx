import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { RadialProgressRing } from '../components/RadialProgressRing';
import { WorkoutPhase, ExerciseKey, useWorkout } from '../state/WorkoutContext';
import { TOTAL_PULLUPS, TOTAL_PUSHUPS, TOTAL_SQUATS, PARTITION_MODES } from '../models/WorkoutConfig';
import { formatDuration } from '../utils/timeFormatter';

type ExercisePhase = 'pullUps' | 'pushUps' | 'squats';
const EXERCISE_PHASES: ExercisePhase[] = ['pullUps', 'pushUps', 'squats'];

const EXERCISE_TOTALS: Record<ExercisePhase, number> = {
  pullUps: TOTAL_PULLUPS,
  pushUps: TOTAL_PUSHUPS,
  squats: TOTAL_SQUATS,
};

const EXERCISE_LABELS: Record<ExercisePhase, string> = {
  pullUps: 'PULL-UPS',
  pushUps: 'PUSH-UPS',
  squats: 'AIR SQUATS',
};

const EXERCISE_TARGETS: Record<ExercisePhase, string> = {
  pullUps: '100',
  pushUps: '200',
  squats: '300',
};

export function WorkoutScreen() {
  const {
    state,
    toggleTimer,
    completeRun1,
    setPhase,
    addReps,
    completeExercise,
    completeRun2,
    reset,
    overallProgress,
    completedRounds,
  } = useWorkout();

  const { elapsed, isRunning, phase, pullUps, pushUps, squats, config } = state;
  const isPartitioned = config?.partitionMode !== 'asRxd';
  const isExercisePhase = EXERCISE_PHASES.includes(phase as ExercisePhase);
  const progressPct = Math.round(overallProgress * 100);

  const repCounts: Record<ExercisePhase, number> = { pullUps, pushUps, squats };
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        {confirmingEnd ? (
          <>
            <TouchableOpacity
              onPress={() => setConfirmingEnd(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.backText}>CANCEL</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, styles.headerTitleWarning]}>END WORKOUT?</Text>
            <TouchableOpacity onPress={reset} style={[styles.timerToggle, styles.timerToggleEnd]}>
              <Text style={styles.timerToggleText}>END</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setConfirmingEnd(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.backText}>END</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>MURPH</Text>
            <TouchableOpacity
              onPress={toggleTimer}
              style={[styles.timerToggle, isRunning ? styles.timerTogglePause : styles.timerToggleResume]}
            >
              <Text style={styles.timerToggleText}>{isRunning ? 'PAUSE' : 'RESUME'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Timer */}
        <View style={styles.timerBlock}>
          <Text style={[styles.timerText, !isRunning && styles.timerTextPaused]}>
            {formatDuration(elapsed)}
          </Text>
          {!isRunning && <Text style={styles.pausedLabel}>PAUSED</Text>}
        </View>

        {/* Progress ring */}
        <View style={styles.ringContainer}>
          <RadialProgressRing
            progress={overallProgress}
            size={160}
            strokeWidth={9}
            centerLabel={`${progressPct}%`}
            subLabel="COMPLETE"
          />
        </View>

        {/* Phase tabs */}
        <PhaseTabs
          currentPhase={phase}
          isPartitioned={isPartitioned}
          pullProgress={pullUps / TOTAL_PULLUPS}
          pushProgress={pushUps / TOTAL_PUSHUPS}
          squatProgress={squats / TOTAL_SQUATS}
          onSelectPhase={setPhase}
        />

        {/* Phase content */}
        <View style={styles.phaseContent}>
          {(phase === 'run1' || phase === 'run2') && (
            <RunPhase
              isRun1={phase === 'run1'}
              isTimerRunning={isRunning}
              onStartTimer={toggleTimer}
              onComplete={phase === 'run1' ? completeRun1 : completeRun2}
            />
          )}

          {isExercisePhase && isPartitioned && (
            <CombinedExerciseView
              repCounts={repCounts}
              onAddReps={addReps}
              completedRounds={completedRounds}
              totalRounds={PARTITION_MODES[config!.partitionMode].totalRounds}
              perRoundValues={{
                pullUps: PARTITION_MODES[config!.partitionMode].pullPerRound,
                pushUps: PARTITION_MODES[config!.partitionMode].pushPerRound,
                squats: PARTITION_MODES[config!.partitionMode].squatPerRound,
              }}
            />
          )}

          {isExercisePhase && !isPartitioned && (
            <AsRxdExerciseView
              currentPhase={phase as ExercisePhase}
              repCounts={repCounts}
              onComplete={completeExercise}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Phase Tab Bar ─────────────────────────────────────────────

interface PhaseTabsProps {
  currentPhase: WorkoutPhase;
  isPartitioned: boolean;
  pullProgress: number;
  pushProgress: number;
  squatProgress: number;
  onSelectPhase: (phase: WorkoutPhase) => void;
}

function PhaseTabs({
  currentPhase,
  isPartitioned,
  pullProgress,
  pushProgress,
  squatProgress,
  onSelectPhase,
}: PhaseTabsProps) {
  const phaseOrder: WorkoutPhase[] = ['run1', 'pullUps', 'pushUps', 'squats', 'run2', 'done'];
  const currentIdx = phaseOrder.indexOf(currentPhase);
  const isExercisePhase = EXERCISE_PHASES.includes(currentPhase as ExercisePhase);

  function isReached(phase: WorkoutPhase) {
    return phaseOrder.indexOf(phase) <= currentIdx;
  }

  if (isPartitioned) {
    // 3-tab view: RUN 1 | EXERCISES | RUN 2
    const exercisesActive = isExercisePhase;
    const exercisesReached = isReached('pullUps');
    const run2Reached = isReached('run2');
    const overallExerciseProgress = (pullProgress + pushProgress + squatProgress) / 3;

    return (
      <View style={tabStyles.container}>
        <View style={[tabStyles.tab, !isExercisePhase && currentPhase === 'run1' && tabStyles.tabActive]}>
          <Text style={[tabStyles.tabLabel, currentPhase === 'run1' && tabStyles.tabLabelActive, isReached('pullUps') && tabStyles.tabLabelDone, currentPhase !== 'run1' && !isReached('run1') && tabStyles.tabLabelDisabled]}>
            RUN 1
          </Text>
          {currentPhase === 'run1' && <View style={tabStyles.activeIndicator} />}
        </View>

        <View style={[tabStyles.tab, tabStyles.tabWide, exercisesActive && tabStyles.tabActive, !exercisesReached && tabStyles.tabDisabled]}>
          <Text style={[tabStyles.tabLabel, exercisesActive && tabStyles.tabLabelActive, exercisesReached && !exercisesActive && tabStyles.tabLabelDone, !exercisesReached && tabStyles.tabLabelDisabled]}>
            EXERCISES
          </Text>
          {exercisesReached && (
            <View style={tabStyles.miniBarTrack}>
              <View style={[tabStyles.miniBarFill, { width: `${overallExerciseProgress * 100}%` as any }]} />
            </View>
          )}
          {exercisesActive && <View style={tabStyles.activeIndicator} />}
        </View>

        <View style={[tabStyles.tab, currentPhase === 'run2' && tabStyles.tabActive, !run2Reached && tabStyles.tabDisabled]}>
          <Text style={[tabStyles.tabLabel, currentPhase === 'run2' && tabStyles.tabLabelActive, currentPhase === 'done' && tabStyles.tabLabelDone, !run2Reached && tabStyles.tabLabelDisabled]}>
            RUN 2
          </Text>
          {currentPhase === 'run2' && <View style={tabStyles.activeIndicator} />}
        </View>
      </View>
    );
  }

  // 5-tab view for As Rx'd
  const tabs: { key: WorkoutPhase; label: string; progress?: number }[] = [
    { key: 'run1', label: 'RUN 1' },
    { key: 'pullUps', label: 'PULL', progress: pullProgress },
    { key: 'pushUps', label: 'PUSH', progress: pushProgress },
    { key: 'squats', label: 'SQUAT', progress: squatProgress },
    { key: 'run2', label: 'RUN 2' },
  ];

  return (
    <View style={tabStyles.container}>
      {tabs.map((tab) => {
        const isActive = currentPhase === tab.key;
        const reached = isReached(tab.key);
        const isDone = reached && !isActive;
        const tappable = isExercisePhase && EXERCISE_PHASES.includes(tab.key as ExercisePhase);

        return (
          <TouchableOpacity
            key={tab.key}
            style={[tabStyles.tab, isActive && tabStyles.tabActive, !reached && tabStyles.tabDisabled]}
            onPress={() => tappable && onSelectPhase(tab.key)}
            activeOpacity={tappable ? 0.7 : 1}
          >
            <Text style={[tabStyles.tabLabel, isActive && tabStyles.tabLabelActive, isDone && tabStyles.tabLabelDone, !reached && tabStyles.tabLabelDisabled]}>
              {tab.label}
            </Text>
            {tab.progress !== undefined && (
              <View style={tabStyles.miniBarTrack}>
                <View style={[tabStyles.miniBarFill, { width: `${tab.progress * 100}%` as any }, !reached && tabStyles.miniBarDisabled]} />
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

function RunPhase({
  isRun1,
  isTimerRunning,
  onStartTimer,
  onComplete,
}: {
  isRun1: boolean;
  isTimerRunning: boolean;
  onStartTimer: () => void;
  onComplete: () => void;
}) {
  return (
    <View style={runStyles.container}>
      <Text style={runStyles.label}>{isRun1 ? 'MILE RUN #1' : 'MILE RUN #2'}</Text>
      <Text style={runStyles.desc}>1 MILE</Text>
      {isRun1 && !isTimerRunning && (
        <TouchableOpacity style={runStyles.startTimerBtn} onPress={onStartTimer}>
          <Text style={runStyles.startTimerText}>START TIMER</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={runStyles.completeBtn} onPress={onComplete} activeOpacity={0.85}>
        <Text style={runStyles.completeBtnText}>RUN COMPLETE</Text>
      </TouchableOpacity>
      <Text style={runStyles.hint}>
        {isRun1 ? 'Tap when you finish the first mile' : 'Tap when you finish the final mile'}
      </Text>
    </View>
  );
}

// ── Combined Exercise View (partitioned modes) ────────────────

function CombinedExerciseView({
  repCounts,
  onAddReps,
  completedRounds,
  totalRounds,
  perRoundValues,
}: {
  repCounts: Record<ExercisePhase, number>;
  onAddReps: (exercise: ExerciseKey, count: number) => void;
  completedRounds: number;
  totalRounds: number;
  perRoundValues: Record<ExercisePhase, number>;
}) {
  return (
    <View style={combinedStyles.container}>
      {EXERCISE_PHASES.map((ep, i) => (
        <View key={ep}>
          <ExerciseBlock
            label={EXERCISE_LABELS[ep]}
            count={repCounts[ep]}
            total={EXERCISE_TOTALS[ep]}
            onAddReps={(n) => onAddReps(ep, n)}
            perRound={perRoundValues[ep]}
          />
          {i < EXERCISE_PHASES.length - 1 && <View style={combinedStyles.divider} />}
        </View>
      ))}

      <View style={combinedStyles.roundContainer}>
        <Text style={combinedStyles.roundLabel}>ROUND</Text>
        <Text style={combinedStyles.roundCount}>
          {completedRounds}
          <Text style={combinedStyles.roundTotal}> / {totalRounds}</Text>
        </Text>
      </View>
    </View>
  );
}

function ExerciseBlock({
  label,
  count,
  total,
  onAddReps,
  perRound,
}: {
  label: string;
  count: number;
  total: number;
  onAddReps: (n: number) => void;
  perRound: number;
}) {
  const progress = count / total;
  const done = count >= total;

  return (
    <View style={blockStyles.container}>
      <View style={blockStyles.header}>
        <Text style={[blockStyles.label, done && blockStyles.labelDone]}>{label}</Text>
        <Text style={[blockStyles.count, done && blockStyles.countDone]}>
          {count} <Text style={blockStyles.countTotal}>/ {total}</Text>
        </Text>
      </View>
      <View style={blockStyles.progressTrack}>
        <View style={[blockStyles.progressFill, { width: `${progress * 100}%` as any }, done && blockStyles.progressDone]} />
      </View>
      <View style={blockStyles.buttons}>
        <RepBtn label="-1" onPress={() => onAddReps(-1)} variant="minus" />
        <RepBtn label="+1" onPress={() => onAddReps(1)} />
        <RepBtn label={`+${perRound}`} onPress={() => onAddReps(perRound)} />
        <RepBtn label={`+${perRound * 2}`} onPress={() => onAddReps(perRound * 2)} variant="large" />
      </View>
    </View>
  );
}

// ── As Rx'd Exercise View ─────────────────────────────────────

function AsRxdExerciseView({
  currentPhase,
  repCounts,
  onComplete,
}: {
  currentPhase: ExercisePhase;
  repCounts: Record<ExercisePhase, number>;
  onComplete: (exercise: ExerciseKey) => void;
}) {
  const label = EXERCISE_LABELS[currentPhase];
  const target = EXERCISE_TARGETS[currentPhase];
  const isDone = repCounts[currentPhase] >= EXERCISE_TOTALS[currentPhase];

  // Show which steps are done as a mini checklist
  const steps: { key: ExercisePhase; label: string }[] = [
    { key: 'pullUps', label: 'PULL-UPS' },
    { key: 'pushUps', label: 'PUSH-UPS' },
    { key: 'squats', label: 'AIR SQUATS' },
  ];

  return (
    <View style={rxdStyles.container}>
      {/* Progress checklist */}
      <View style={rxdStyles.checklist}>
        {steps.map((s) => {
          const stepDone = repCounts[s.key] >= EXERCISE_TOTALS[s.key];
          const isCurrent = s.key === currentPhase;
          return (
            <View key={s.key} style={[rxdStyles.checkRow, isCurrent && rxdStyles.checkRowActive]}>
              <View style={[rxdStyles.checkDot, stepDone && rxdStyles.checkDotDone, isCurrent && !stepDone && rxdStyles.checkDotActive]} />
              <Text style={[rxdStyles.checkLabel, isCurrent && rxdStyles.checkLabelActive, stepDone && rxdStyles.checkLabelDone]}>
                {s.label}
              </Text>
              {stepDone && <Text style={rxdStyles.checkTick}>DONE</Text>}
            </View>
          );
        })}
      </View>

      <View style={rxdStyles.divider} />

      {/* Active exercise */}
      <Text style={rxdStyles.currentLabel}>{label}</Text>
      <Text style={rxdStyles.targetText}>{target} REPS — UNBROKEN</Text>

      {!isDone ? (
        <TouchableOpacity
          style={rxdStyles.completeBtn}
          onPress={() => onComplete(currentPhase)}
          activeOpacity={0.85}
        >
          <Text style={rxdStyles.completeBtnText}>MARK COMPLETE</Text>
        </TouchableOpacity>
      ) : (
        <View style={rxdStyles.doneBox}>
          <Text style={rxdStyles.doneText}>COMPLETE</Text>
        </View>
      )}
    </View>
  );
}

// ── Shared Rep Button ─────────────────────────────────────────

function RepBtn({
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
      style={[repStyles.btn, variant === 'minus' && repStyles.btnMinus, variant === 'large' && repStyles.btnLarge]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[repStyles.label, variant === 'minus' && repStyles.labelMinus, variant === 'large' && repStyles.labelLarge]}>
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
  backText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2, minWidth: 40 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: colors.textPrimary, letterSpacing: 5 },
  timerToggle: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 3, minWidth: 72, alignItems: 'center' },
  timerTogglePause: { backgroundColor: colors.surfaceElevated },
  timerToggleResume: { backgroundColor: colors.accent },
  timerToggleEnd: { backgroundColor: '#CC2222' },
  headerTitleWarning: { color: '#CC2222' },
  timerToggleText: { fontSize: 11, fontWeight: '800', color: colors.textPrimary, letterSpacing: 1.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  timerBlock: { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  timerText: { fontSize: 68, fontWeight: '900', color: colors.textPrimary, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  timerTextPaused: { color: colors.textSecondary },
  pausedLabel: { fontSize: 11, fontWeight: '700', color: colors.accent, letterSpacing: 4, marginTop: 4 },
  ringContainer: { alignItems: 'center', paddingVertical: 12 },
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
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 2, position: 'relative' },
  tabWide: { flex: 1.6 },
  tabActive: { backgroundColor: colors.surfaceVariant },
  tabDisabled: { opacity: 0.35 },
  tabLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2 },
  tabLabelActive: { color: colors.accent },
  tabLabelDone: { color: colors.textPrimary },
  tabLabelDisabled: { color: colors.textMuted },
  miniBarTrack: { height: 2, backgroundColor: colors.progressTrack, borderRadius: 1, marginTop: 4, width: '80%', overflow: 'hidden' },
  miniBarFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 1 },
  miniBarDisabled: { backgroundColor: colors.textMuted },
  activeIndicator: { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, backgroundColor: colors.accent, borderRadius: 1 },
});

const runStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 3, marginBottom: 6 },
  desc: { fontSize: 42, fontWeight: '900', color: colors.textPrimary, letterSpacing: 2, marginBottom: 32 },
  startTimerBtn: {
    backgroundColor: colors.surface, borderRadius: 4, paddingHorizontal: 32, paddingVertical: 14,
    marginBottom: 12, borderWidth: 1, borderColor: colors.divider,
  },
  startTimerText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, letterSpacing: 2 },
  completeBtn: {
    backgroundColor: colors.accent, borderRadius: 4, paddingHorizontal: 48, paddingVertical: 18,
    width: '100%', alignItems: 'center',
  },
  completeBtnText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, letterSpacing: 3 },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 16, letterSpacing: 0.5 },
});

const combinedStyles = StyleSheet.create({
  container: { gap: 0 },
  divider: { height: 1, backgroundColor: colors.divider },
  roundContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 4, padding: 16, marginTop: 12,
  },
  roundLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 3 },
  roundCount: { fontSize: 28, fontWeight: '900', color: colors.textPrimary },
  roundTotal: { fontSize: 20, fontWeight: '400', color: colors.textSecondary },
});

const blockStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2.5 },
  labelDone: { color: colors.accent },
  count: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  countDone: { color: colors.accent },
  countTotal: { fontSize: 16, fontWeight: '400', color: colors.textMuted },
  progressTrack: { height: 3, backgroundColor: colors.progressTrack, borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  progressDone: { backgroundColor: colors.accent },
  buttons: { flexDirection: 'row', gap: 6 },
});

const rxdStyles = StyleSheet.create({
  container: { paddingTop: 8 },
  checklist: {
    backgroundColor: colors.surface, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 16, gap: 0,
  },
  checkRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  checkRowActive: {},
  checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surfaceElevated, marginRight: 12 },
  checkDotActive: { backgroundColor: colors.accent },
  checkDotDone: { backgroundColor: colors.accent },
  checkLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textMuted, letterSpacing: 1.5 },
  checkLabelActive: { color: colors.textPrimary },
  checkLabelDone: { color: colors.textSecondary },
  checkTick: { fontSize: 10, fontWeight: '700', color: colors.accent, letterSpacing: 1.5 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 24 },
  currentLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 4, textAlign: 'center', marginBottom: 8 },
  targetText: { fontSize: 28, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', letterSpacing: 1, marginBottom: 32 },
  completeBtn: {
    backgroundColor: colors.accent, borderRadius: 4, paddingVertical: 20,
    alignItems: 'center', width: '100%',
  },
  completeBtnText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, letterSpacing: 3 },
  doneBox: {
    backgroundColor: colors.surfaceVariant, borderRadius: 4, paddingVertical: 20,
    alignItems: 'center', borderWidth: 1, borderColor: colors.accent,
  },
  doneText: { fontSize: 15, fontWeight: '800', color: colors.accent, letterSpacing: 4 },
});

const repStyles = StyleSheet.create({
  btn: {
    flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 4, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  btnMinus: { flex: 0, width: 48, backgroundColor: colors.background },
  btnLarge: { backgroundColor: colors.accent, flex: 1.2 },
  label: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  labelMinus: { color: colors.textMuted },
  labelLarge: { fontSize: 16, fontWeight: '800' },
});
