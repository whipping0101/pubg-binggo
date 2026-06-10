import { missions } from '../data/missions';

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function createInitialBoardIds(): number[] {
  return shuffleArray(missions).map((mission) => mission.id);
}

export function countBingo(boardMissionIds: number[], completed: Set<number>): number {
  let bingoCount = 0;

  for (let i = 0; i < 4; i++) {
    const rowComplete = Array.from({ length: 4 }, (_, j) => boardMissionIds[i * 4 + j]).every(
      (id) => completed.has(id)
    );
    if (rowComplete) bingoCount++;

    const colComplete = Array.from({ length: 4 }, (_, j) => boardMissionIds[j * 4 + i]).every(
      (id) => completed.has(id)
    );
    if (colComplete) bingoCount++;
  }

  const diag1Complete = [0, 5, 10, 15]
    .map((i) => boardMissionIds[i])
    .every((id) => completed.has(id));
  if (diag1Complete) bingoCount++;

  const diag2Complete = [3, 6, 9, 12]
    .map((i) => boardMissionIds[i])
    .every((id) => completed.has(id));
  if (diag2Complete) bingoCount++;

  return bingoCount;
}
