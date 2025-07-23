import { Schema } from 'mongoose';
import {
  SimNodeBehaviorModel,
  ISimNodeBehaviorBase,
} from './SimNodeBehavior.base';
import { SimulationMode, PatternType } from './SimulationEnums';

/* ♢ STATIC */
export interface IStaticBehavior extends ISimNodeBehaviorBase {
  value: any;
}
SimNodeBehaviorModel.discriminator(
  SimulationMode.STATIC,
  new Schema<IStaticBehavior>({
    value: Schema.Types.Mixed,
  })
);

/* ♢ RANDOM */
export interface IRandomBehavior extends ISimNodeBehaviorBase {
  minValue: number;
  maxValue: number;
  distribution: 'uniform' | 'normal' | 'exponential';
  mean?: number;
  stdDev?: number;
  seed?: number;
}
SimNodeBehaviorModel.discriminator(
  SimulationMode.RANDOM,
  new Schema<IRandomBehavior>({
    minValue: Number,
    maxValue: Number,
    distribution: { type: String, enum: ['uniform', 'normal', 'exponential'] },
    mean: Number,
    stdDev: Number,
    seed: Number,
  })
);

/* ♢ PATTERN */
export interface IPatternBehavior extends ISimNodeBehaviorBase {
  patternType: PatternType;
  minValue: number;
  maxValue: number;
  period: number;
  phaseShift?: number;
  customPoints?: { x: number; y: number }[];
}
SimNodeBehaviorModel.discriminator(
  SimulationMode.PATTERN,
  new Schema<IPatternBehavior>({
    patternType: { type: String, enum: Object.values(PatternType) },
    minValue: Number,
    maxValue: Number,
    period: Number,
    phaseShift: Number,
    customPoints: [{ x: Number, y: Number }],
  })
);

/* ♢ DRIFT, REPLAY, FORMULA … add similarly */
