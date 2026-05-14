export type PartitionMode = 'asRxd' | 'twentyRounds' | 'tenRounds';

export interface WorkoutConfig {
  athleteName: string;
  date: string; // ISO date string
  notes: string;
  partitionMode: PartitionMode;
  hasVest: boolean;
  vestWeight: 20 | 14;
}

export const PARTITION_MODES: Record<
  PartitionMode,
  { label: string; description: string; totalRounds: number; pullPerRound: number; pushPerRound: number; squatPerRound: number }
> = {
  asRxd: {
    label: "As Rx'd",
    description: '100 / 200 / 300',
    totalRounds: 1,
    pullPerRound: 100,
    pushPerRound: 200,
    squatPerRound: 300,
  },
  twentyRounds: {
    label: '20 Rounds',
    description: '5 / 10 / 15',
    totalRounds: 20,
    pullPerRound: 5,
    pushPerRound: 10,
    squatPerRound: 15,
  },
  tenRounds: {
    label: '10 Rounds',
    description: '10 / 20 / 30',
    totalRounds: 10,
    pullPerRound: 10,
    pushPerRound: 20,
    squatPerRound: 30,
  },
};

export const TOTAL_PULLUPS = 100;
export const TOTAL_PUSHUPS = 200;
export const TOTAL_SQUATS = 300;
