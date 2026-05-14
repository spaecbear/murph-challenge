import { Platform } from 'react-native';
import { WorkoutConfig, PARTITION_MODES } from '../models/WorkoutConfig';
import { formatDuration } from './timeFormatter';

interface SplitData {
  run1EndTime: number;
  exercisesEndTime: number;
  run2EndTime: number;
}

function buildContent(config: WorkoutConfig, splits: SplitData): string {
  const run1Duration = splits.run1EndTime;
  const middleDuration = splits.exercisesEndTime - splits.run1EndTime;
  const run2Duration = splits.run2EndTime - splits.exercisesEndTime;
  const totalDuration = splits.run2EndTime;

  const vestStr = config.hasVest
    ? `Weight Vest (${config.vestWeight} lb)`
    : 'No Weight Vest';
  const modeData = PARTITION_MODES[config.partitionMode];
  const modeStr = `${modeData.label} (${modeData.description})`;

  const dateObj = new Date(config.date);
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const separator = '─'.repeat(42);
  const lines: string[] = [
    'MURPH CHALLENGE RESULTS',
    '='.repeat(42),
    '',
    `Athlete:    ${config.athleteName}`,
    `Date:       ${dateStr}`,
    `Mode:       ${modeStr}`,
    `Vest:       ${vestStr}`,
    ...(config.notes.trim() ? [`Notes:      ${config.notes.trim()}`] : []),
    '',
    'SPLITS',
    separator,
    `Mile Run #1:      ${formatDuration(0)} – ${formatDuration(splits.run1EndTime)}   (${formatDuration(run1Duration)})`,
    `Middle Section:   ${formatDuration(splits.run1EndTime)} – ${formatDuration(splits.exercisesEndTime)}   (${formatDuration(middleDuration)})`,
    `Mile Run #2:      ${formatDuration(splits.exercisesEndTime)} – ${formatDuration(splits.run2EndTime)}   (${formatDuration(run2Duration)})`,
    separator,
    `TOTAL TIME:       ${formatDuration(totalDuration)}`,
    '',
    `Generated ${new Date().toLocaleString()}`,
  ];

  return lines.join('\n');
}

function getFilename(config: WorkoutConfig): string {
  const safeName = config.athleteName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date(config.date).toISOString().split('T')[0];
  return `murph_${safeName}_${dateStr}.txt`;
}

export async function exportResults(
  config: WorkoutConfig,
  splits: SplitData
): Promise<{ success: boolean; path?: string; content: string }> {
  const content = buildContent(config, splits);
  const filename = getFilename(config);

  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return { success: true, content };
  }

  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');

  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/plain',
      dialogTitle: 'Export Murph Results',
    });
  }

  return { success: true, path: fileUri, content };
}
