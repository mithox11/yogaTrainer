export type RoutineCategory = 
  | 'Relaxation'
  | 'Stretch'
  | 'Exercise'
  | 'Foundation'
  | 'Balance and Flexibility'
  | 'Stretch and Balance'
  | 'Core Strength'
  | 'Flexibility';

export interface HoldTimeByStyle {
  hatha: string;
  vinyasa: string;
  yin: string;
}

export interface Pose {
  id: string;
  nameSanskrit: string;
  nameSpanish: string;
  category: string;
  difficulty: string;
  targetArea: string;
  benefits: string;
  imageFileName: string;
  yogaType: string;
  recommendedDuration: string;
  holdTimeByStyle: HoldTimeByStyle;
  instructions?: string[];
  stepByStepInstructions?: string[];
}

export interface BreathRoutine {
  id: string;
  name: string;
  description: string;
  ratio: string;
  benefits: string;
  yogaType?: string;
  imageFileName?: string;
  instructions?: string[];
  stepByStepInstructions?: string[];
}

export interface PoseSequenceItem {
  poseId: string;
  duration: string;
}

export interface RoutineFrameworkPhase {
  phaseName: string;
  description: string;
  poses: PoseSequenceItem[];
}

export interface Routine {
  id: string;
  title: string;
  style: string;
  category: RoutineCategory;
  durationMinutes: number;
  level: string;
  focus: string;
  description: string;
  breathRoutine: string;
  phases: RoutineFrameworkPhase[];
}

export interface YogaDatasetInfo {
  title: string;
  version: string;
  description: string;
  imagesPath: string;
  availableRoutineCategories: RoutineCategory[];
}

export interface YogaDatabase {
  info: YogaDatasetInfo;
  poses: Pose[];
  breathRoutines: BreathRoutine[];
  routines: Routine[];
}
