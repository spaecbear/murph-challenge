import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  WorkoutConfig,
  PARTITION_MODES,
  TOTAL_PULLUPS,
  TOTAL_PUSHUPS,
  TOTAL_SQUATS,
} from '../models/WorkoutConfig';

export type WorkoutPhase = 'run1' | 'pullUps' | 'pushUps' | 'squats' | 'run2' | 'done';
export type AppScreen = 'setup' | 'workout' | 'results';
export type ExerciseKey = 'pullUps' | 'pushUps' | 'squats';

export interface WorkoutState {
  config: WorkoutConfig | null;
  screen: AppScreen;
  phase: WorkoutPhase;
  elapsed: number;
  isRunning: boolean;
  pullUps: number;
  pushUps: number;
  squats: number;
  run1EndTime: number | null;
  exercisesEndTime: number | null;
  run2EndTime: number | null;
}

const initialState: WorkoutState = {
  config: null,
  screen: 'setup',
  phase: 'run1',
  elapsed: 0,
  isRunning: false,
  pullUps: 0,
  pushUps: 0,
  squats: 0,
  run1EndTime: null,
  exercisesEndTime: null,
  run2EndTime: null,
};

type Action =
  | { type: 'START_WORKOUT'; config: WorkoutConfig }
  | { type: 'TICK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'COMPLETE_RUN1' }
  | { type: 'SET_PHASE'; phase: WorkoutPhase }
  | { type: 'ADD_REPS'; exercise: ExerciseKey; count: number }
  | { type: 'COMPLETE_EXERCISE'; exercise: ExerciseKey }
  | { type: 'COMPLETE_RUN2' }
  | { type: 'RESET' };

const EXERCISE_PHASES: WorkoutPhase[] = ['pullUps', 'pushUps', 'squats'];

function reducer(state: WorkoutState, action: Action): WorkoutState {
  switch (action.type) {
    case 'START_WORKOUT':
      return { ...initialState, config: action.config, screen: 'workout', phase: 'run1' };

    case 'TICK':
      if (!state.isRunning) return state;
      return { ...state, elapsed: state.elapsed + 1 };

    case 'PAUSE':
      return { ...state, isRunning: false };

    case 'RESUME':
      return { ...state, isRunning: true };

    case 'COMPLETE_RUN1':
      if (state.phase !== 'run1') return state;
      return { ...state, run1EndTime: state.elapsed, phase: 'pullUps' };

    case 'SET_PHASE': {
      if (!EXERCISE_PHASES.includes(action.phase)) return state;
      if (!EXERCISE_PHASES.includes(state.phase)) return state;
      return { ...state, phase: action.phase };
    }

    case 'ADD_REPS': {
      const next = { ...state };
      if (action.exercise === 'pullUps') {
        next.pullUps = Math.min(TOTAL_PULLUPS, Math.max(0, state.pullUps + action.count));
      } else if (action.exercise === 'pushUps') {
        next.pushUps = Math.min(TOTAL_PUSHUPS, Math.max(0, state.pushUps + action.count));
      } else {
        next.squats = Math.min(TOTAL_SQUATS, Math.max(0, state.squats + action.count));
      }
      if (
        next.pullUps >= TOTAL_PULLUPS &&
        next.pushUps >= TOTAL_PUSHUPS &&
        next.squats >= TOTAL_SQUATS &&
        state.phase !== 'run2' &&
        state.phase !== 'done'
      ) {
        next.exercisesEndTime = next.elapsed;
        next.phase = 'run2';
      }
      return next;
    }

    case 'COMPLETE_EXERCISE': {
      const next = { ...state };
      if (action.exercise === 'pullUps') {
        next.pullUps = TOTAL_PULLUPS;
        next.phase = 'pushUps';
      } else if (action.exercise === 'pushUps') {
        next.pushUps = TOTAL_PUSHUPS;
        next.phase = 'squats';
      } else {
        next.squats = TOTAL_SQUATS;
        next.exercisesEndTime = next.elapsed;
        next.phase = 'run2';
      }
      return next;
    }

    case 'COMPLETE_RUN2':
      if (state.phase !== 'run2') return state;
      return { ...state, run2EndTime: state.elapsed, phase: 'done', isRunning: false, screen: 'results' };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

interface WorkoutContextValue {
  state: WorkoutState;
  startWorkout: (config: WorkoutConfig) => void;
  pause: () => void;
  resume: () => void;
  toggleTimer: () => void;
  completeRun1: () => void;
  setPhase: (phase: WorkoutPhase) => void;
  addReps: (exercise: ExerciseKey, count: number) => void;
  completeExercise: (exercise: ExerciseKey) => void;
  completeRun2: () => void;
  reset: () => void;
  overallProgress: number;
  completedRounds: number;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning]);

  const startWorkout = useCallback((config: WorkoutConfig) => {
    dispatch({ type: 'START_WORKOUT', config });
  }, []);
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const resume = useCallback(() => dispatch({ type: 'RESUME' }), []);
  const toggleTimer = useCallback(() => {
    dispatch({ type: state.isRunning ? 'PAUSE' : 'RESUME' });
  }, [state.isRunning]);
  const completeRun1 = useCallback(() => dispatch({ type: 'COMPLETE_RUN1' }), []);
  const setPhase = useCallback((phase: WorkoutPhase) => dispatch({ type: 'SET_PHASE', phase }), []);
  const addReps = useCallback((exercise: ExerciseKey, count: number) => {
    dispatch({ type: 'ADD_REPS', exercise, count });
  }, []);
  const completeExercise = useCallback((exercise: ExerciseKey) => {
    dispatch({ type: 'COMPLETE_EXERCISE', exercise });
  }, []);
  const completeRun2 = useCallback(() => dispatch({ type: 'COMPLETE_RUN2' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const overallProgress = useMemo(() => {
    const run1Done = state.phase !== 'run1' ? 1 : 0;
    const pull = state.pullUps / TOTAL_PULLUPS;
    const push = state.pushUps / TOTAL_PUSHUPS;
    const squat = state.squats / TOTAL_SQUATS;
    const run2Done = state.phase === 'done' ? 1 : 0;
    return (run1Done + pull + push + squat + run2Done) / 5;
  }, [state.phase, state.pullUps, state.pushUps, state.squats]);

  const completedRounds = useMemo(() => {
    if (!state.config || state.config.partitionMode === 'asRxd') return 0;
    const m = PARTITION_MODES[state.config.partitionMode];
    return Math.min(
      Math.floor(state.pullUps / m.pullPerRound),
      Math.floor(state.pushUps / m.pushPerRound),
      Math.floor(state.squats / m.squatPerRound)
    );
  }, [state.config, state.pullUps, state.pushUps, state.squats]);

  return (
    <WorkoutContext.Provider
      value={{
        state,
        startWorkout,
        pause,
        resume,
        toggleTimer,
        completeRun1,
        setPhase,
        addReps,
        completeExercise,
        completeRun2,
        reset,
        overallProgress,
        completedRounds,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}
