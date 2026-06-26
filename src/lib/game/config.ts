// Game configuration: payout odds and rules.
// Centralized so balancing/tuning is easy and isolated from components.

export const ODDS = {
  /** 勝敗予想 (HOME/AWAY 勝ち抜け) の払い戻し倍率 */
  match: 2,
  /** ゴール予想 (90分+延長で得点) の払い戻し倍率 */
  goal: 3,
  /** 優勝国予想: 順位ごとの払い戻し倍率 (的中したチームが優勝した場合) */
  champion: {
    1: 3,
    2: 5,
    3: 8,
  } as Record<number, number>,
};

export const GAME = {
  currency: "BASHI",
  initialBalance: 10000,
  maxGoalBetsPerMatch: 3,
  maxChampionRanks: 3,
};
