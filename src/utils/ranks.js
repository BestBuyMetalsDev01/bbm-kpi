// Rank System Configuration
// Based on total goals hit (totalWins)
export const RANKS = [
    { name: 'Copper', minWins: 0, icon: 'Copper_Rank.png' },
    { name: 'Bronze', minWins: 3, icon: 'Bronze_Rank.png' },
    { name: 'Silver', minWins: 6, icon: 'Silver_Rank.png' },
    { name: 'Gold', minWins: 12, icon: 'Gold_Rank.png' },
    { name: 'Platinum', minWins: 24, icon: 'Platinum_Rank.png' },
    { name: 'Diamond', minWins: 36, icon: 'Diamond_Rank.png' },
    { name: 'Champion', minWins: 48, icon: 'Champion_Rank.png' },
];

/**
 * Get the rank for a given number of total wins
 * @param {number} totalWins - Number of months where goal was hit
 * @returns {{ name: string, icon: string, minWins: number }}
 */
export const getRank = (totalWins) => {
    let rank = RANKS[0];
    for (const r of RANKS) {
        if (totalWins >= r.minWins) {
            rank = r;
        }
    }
    return rank;
};

/**
 * Get the next rank and progress towards it
 * @param {number} totalWins
 * @returns {{ nextRank: object | null, progress: number, winsNeeded: number }}
 */
export const getNextRankProgress = (totalWins) => {
    const currentRank = getRank(totalWins);
    const currentIndex = RANKS.indexOf(currentRank);

    if (currentIndex >= RANKS.length - 1) {
        return { nextRank: null, progress: 100, winsNeeded: 0 };
    }

    const nextRank = RANKS[currentIndex + 1];
    const winsNeeded = nextRank.minWins - totalWins;
    const rangeStart = currentRank.minWins;
    const rangeEnd = nextRank.minWins;
    const progress = ((totalWins - rangeStart) / (rangeEnd - rangeStart)) * 100;

    return { nextRank, progress: Math.min(100, Math.max(0, progress)), winsNeeded };
};
