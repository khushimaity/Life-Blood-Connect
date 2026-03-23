/**
 * Donor level definitions
 */
const DONOR_LEVELS = {
    BRONZE: { 
        name: 'Bronze Hero', 
        minDonations: 1,
        maxDonations: 2,
        color: 'amber',
        icon: '🥉',
        nextLevel: 'Silver Hero',
        nextLevelMin: 3
    },
    SILVER: { 
        name: 'Silver Hero', 
        minDonations: 3,
        maxDonations: 5,
        color: 'slate',
        icon: '🥈',
        nextLevel: 'Gold Hero',
        nextLevelMin: 6
    },
    GOLD: { 
        name: 'Gold Hero', 
        minDonations: 6,
        maxDonations: 9,
        color: 'yellow',
        icon: '🥇',
        nextLevel: 'Platinum Champion',
        nextLevelMin: 10
    },
    PLATINUM: { 
        name: 'Platinum Champion', 
        minDonations: 10,
        maxDonations: 19,
        color: 'blue',
        icon: '💎',
        nextLevel: 'Diamond Legend',
        nextLevelMin: 20
    },
    DIAMOND: { 
        name: 'Diamond Legend', 
        minDonations: 20,
        maxDonations: Infinity,
        color: 'purple',
        icon: '👑',
        nextLevel: null,
        nextLevelMin: null
    }
};

/**
 * Get donor level based on donation count
 * @param {number} donationCount - Total number of donations
 * @returns {Object} Level information
 */
const getDonorLevel = (donationCount) => {
    if (donationCount >= 20) return DONOR_LEVELS.DIAMOND;
    if (donationCount >= 10) return DONOR_LEVELS.PLATINUM;
    if (donationCount >= 6) return DONOR_LEVELS.GOLD;
    if (donationCount >= 3) return DONOR_LEVELS.SILVER;
    if (donationCount >= 1) return DONOR_LEVELS.BRONZE;
    
    // New donor (0 donations)
    return {
        name: 'New Donor',
        minDonations: 0,
        maxDonations: 0,
        color: 'gray',
        icon: '🌱',
        nextLevel: 'Bronze Hero',
        nextLevelMin: 1
    };
};

/**
 * Calculate progress to next level
 * @param {number} donationCount - Current donation count
 * @returns {Object} Progress information
 */
const getLevelProgress = (donationCount) => {
    const currentLevel = getDonorLevel(donationCount);
    
    if (!currentLevel.nextLevel) {
        return {
            currentLevel: currentLevel.name,
            nextLevel: null,
            progress: 100,
            donationsNeeded: 0,
            percentage: 100
        };
    }
    
    const donationsToNext = currentLevel.nextLevelMin - donationCount;
    const totalNeeded = currentLevel.nextLevelMin - currentLevel.minDonations;
    const progress = donationCount - currentLevel.minDonations;
    const percentage = Math.min(100, Math.round((progress / totalNeeded) * 100));
    
    return {
        currentLevel: currentLevel.name,
        nextLevel: currentLevel.nextLevel,
        progress: progress,
        donationsNeeded: donationsToNext,
        percentage: percentage,
        icon: currentLevel.icon,
        color: currentLevel.color
    };
};

module.exports = {
    DONOR_LEVELS,
    getDonorLevel,
    getLevelProgress
};