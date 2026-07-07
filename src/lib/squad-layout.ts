import type { PositionCode } from '@/types';

const BASE_X: Record<PositionCode, number> = {
  GK: 50,
  LB: 20,
  RB: 80,
  CB: 50,
  CDM: 50,
  LM: 22,
  CM: 50,
  RM: 78,
  LW: 20,
  RW: 80,
  CAM: 50,
  CF: 50,
  ST: 50,
};

const BASE_Y_TOP: Record<PositionCode, number> = {
  GK: 8,
  LB: 32,
  RB: 32,
  CB: 32,
  CDM: 44,
  LM: 55,
  CM: 60,
  RM: 55,
  LW: 64,
  RW: 64,
  CAM: 64,
  CF: 72,
  ST: 85,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getPositionCoordinates(
  position: PositionCode,
  teamNumber: 1 | 2,
  samePositionIndex: number,
  samePositionTotal: number
) {
  const spreadStep = 7;
  const centeredOffset = (samePositionIndex - (samePositionTotal - 1) / 2) * spreadStep;

  const x = clamp(BASE_X[position] + centeredOffset, 8, 92);
  const yTop = BASE_Y_TOP[position];
  const y = teamNumber === 1 ? yTop : 100 - yTop;

  return { x, y };
}

export function getDisplayCoordinates(
  rawX: number,
  rawY: number,
  teamNumber: 1 | 2
) {
  let x = rawX;
  let y = rawY;
console.log("rawX", rawX, "rawY", rawY, "teamNumber", teamNumber);

  if (teamNumber === 1) {
    y = rawY / 2;
    x = clamp(x, 8, 92);
    y = clamp(y, 6, 94);
  } else {
   
    x = 100 - rawX;
    y =  50 + rawY/2;
    x = clamp(x, 8, 92);
    y = clamp(y, 6, 94);
  }

  
  

  return { x, y };
}
