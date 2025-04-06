// src/data/PowerUps.ts

export interface PowerUp {
  key: string;
  name: string;
  description: string;
}

export const ALL_POWERUPS: PowerUp[] = [
  {
    key: "sonar_boost",
    name: "Enhanced Sonar",
    description: "Increases sonar detection range",
  },
  {
    key: "silent_sonar",
    name: "Silent Sonar",
    description: "Your sonar doesn't trigger ennemy during 30sec",
  },
  {
    key: "hull_reinforce",
    name: "Reinforced Hull",
    description: "Adds +1 hit point, allowing one extra collision.",
  },
  {
    key: "propulsion_boost",
    name: "Rapid Propulsion",
    description: "Increases horizontal speed.",
  },
  {
    key: "sonar_recharge",
    name: "Express Sonar Recharge",
    description: "Increase sonar recharge",
  },
  {
    key: "extra_torpedo",
    name: "Extra Torpedo",
    description: "Adds +1 temporary torpedo slot and equips a random available torpedo.",
  },
  {
    key: "temp_shield",
    name: "Temporary Shield",
    description: "Become invincible to collisions for 10 seconds.",
  },
];

export function getRandomPowerUps(count: number): PowerUp[] {
  const shuffled = Phaser.Utils.Array.Shuffle([...ALL_POWERUPS]);
  return shuffled.slice(0, count);
}

export function getPowerUpDefinition(key: string): PowerUp | undefined {
  return ALL_POWERUPS.find((p) => p.key === key);
}

export default {};
