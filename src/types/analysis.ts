import type { EvaluationLabel, PaceType } from "./race";

export interface HorseEvaluation {
  horseNumber: number;
  horseName: string;
  evaluation: EvaluationLabel;
  notes: string;
}

export interface AnalysisStep {
  step: number;
  title: string;
  content: string;
}

export interface BettingTarget {
  type: "3連複" | "3連単" | "ワイド" | "馬連";
  selections: string;
  reasoning: string;
  uncertainty: "順番不安" | "存在不安" | "両方" | "なし";
}

export interface AnalysisResult {
  raceId: string;
  raceInfo: {
    name: string;
    venue: string;
    surface: string;
    distance: number;
    horseCount: number;
    raceClass: string;
  };
  pace: PaceType;
  paceReasoning: string;
  evaluations: HorseEvaluation[];
  mainBody: number[];
  mainBodyShift: string;
  outsideShift: number[];
  steps: AnalysisStep[];
  bettingTargets: BettingTarget[];
  warnings: string[];
  createdAt: string;
}

export interface ZIndexData {
  horseNumber: number;
  horseName: string;
  zIndex: number;
}
