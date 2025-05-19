export const cardColors = [
  '#FF3B30', '#FF9500', '#FFCC00', '#00C7BE', '#30B0C7',
  '#32ADE6', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E'
];

export function getGoalColor(goalId: number | string) {
  const idNum = typeof goalId === 'string' ? parseInt(goalId, 10) : goalId;
  if (isNaN(idNum)) return cardColors[0];
  return cardColors[Math.abs(idNum) % cardColors.length];
} 