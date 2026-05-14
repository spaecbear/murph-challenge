import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WorkoutProvider, useWorkout } from './src/state/WorkoutContext';
import { SetupScreen } from './src/screens/SetupScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { colors } from './src/theme/colors';

function AppContent() {
  const { state } = useWorkout();
  switch (state.screen) {
    case 'workout':
      return <WorkoutScreen />;
    case 'results':
      return <ResultsScreen />;
    default:
      return <SetupScreen />;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <WorkoutProvider>
        <StatusBar style="light" backgroundColor={colors.background} />
        <AppContent />
      </WorkoutProvider>
    </SafeAreaProvider>
  );
}
