import {
  Crosshair,
  Flame,
  Target,
  Trophy,
  Skull,
  Bomb,
  Telescope,
  Rabbit,
  Swords,
  Hammer,
  Radar,
  Building,
  Zap,
  CircleDot,
  MapPin,
  X,
} from 'lucide-react';

export type Mission = {
  id: number;
  text: string;
  icon: typeof Crosshair;
};

export const missions: Mission[] = [
  { id: 1, text: '판처 킬', icon: Hammer },
  { id: 2, text: '화염병 킬', icon: Flame },
  { id: 3, text: '합산 12킬', icon: Target },
  { id: 4, text: '에란겔 치킨', icon: Trophy },
  { id: 5, text: '개인 6킬', icon: Crosshair },
  { id: 6, text: '수류탄 킬', icon: Bomb },
  { id: 7, text: '200m 킬', icon: Telescope },
  { id: 8, text: '고라니 킬', icon: Rabbit },
  { id: 9, text: '석궁 킬', icon: Swords },
  { id: 10, text: '근접 무기 킬', icon: Skull },
  { id: 11, text: '400m 킬', icon: Radar },
  { id: 12, text: '대도시 졸업', icon: Building },
  { id: 13, text: '샷건 킬', icon: Zap },
  { id: 14, text: '권총 킬', icon: CircleDot },
  { id: 15, text: '태이고 치킨', icon: MapPin },
  { id: 16, text: '처형', icon: X },
];

export const missionById = Object.fromEntries(
  missions.map((mission) => [mission.id, mission])
) as Record<number, Mission>;
