export type SurfaceType = "芝" | "ダート" | "障害";
export type CourseDirection = "右" | "左" | "直線";
export type WeatherType = "晴" | "曇" | "小雨" | "雨" | "小雪" | "雪";
export type TrackCondition = "良" | "稍重" | "重" | "不良";
export type RaceClass =
  | "G1"
  | "G2"
  | "G3"
  | "OP"
  | "L"
  | "3勝クラス"
  | "2勝クラス"
  | "1勝クラス"
  | "未勝利"
  | "新馬";

export type PaceType = "S" | "M" | "H";
export type EvaluationLabel = "A" | "B" | "C" | "D" | "D+";

export interface Race {
  id: string;
  name: string;
  venue: string;
  date: string;
  raceNumber: number;
  surface: SurfaceType;
  distance: number;
  raceClass: RaceClass;
  horseCount: number;
  weather?: WeatherType;
  trackCondition?: TrackCondition;
  courseDirection?: CourseDirection;
  startTime?: string;
  prizeFirst?: number;
}

export interface Horse {
  id: string;
  name: string;
  sex: "牡" | "牝" | "騸";
  age: number;
  color?: string;
  trainer?: string;
  owner?: string;
  breeder?: string;
}

export interface Entry {
  id: string;
  raceId: string;
  horseId: string;
  horseName: string;
  gateNumber: number;
  horseNumber: number;
  sex: string;
  age: number;
  weight?: number;
  jockey: string;
  trainer: string;
  odds?: number;
  popularity?: number;
  loadWeight: number;
  horseWeight?: number;
  horseWeightDiff?: number;
  zIndex?: number;
  pastRaces?: PastRace[];
}

export interface PastRace {
  date: string;
  venue: string;
  raceClass: string;
  surface: SurfaceType;
  distance: number;
  weather?: WeatherType;
  trackCondition?: TrackCondition;
  horseCount: number;
  gateNumber: number;
  horseNumber: number;
  popularity: number;
  finishPosition: number;
  jockey: string;
  loadWeight: number;
  horseWeight?: number;
  horseWeightDiff?: number;
  corner1?: number;
  corner2?: number;
  corner3?: number;
  corner4?: number;
  finalTime?: string;
  margin?: string;
  pace?: string;
  rapTime?: string;
}

export interface RaceWithEntries extends Race {
  entries: Entry[];
}
