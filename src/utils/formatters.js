export const formatCurrency = (val) => {
    const num = Number(val);
    if (!Number.isFinite(num)) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(num);
};

export const formatNumber = (val) => {
    const num = Number(val);
    if (!Number.isFinite(num)) return '0';
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0
    }).format(num);
};

export const formatPercent = (val) => {
    const num = Number(val);
    if (!Number.isFinite(num)) return '0.0%';
    return `${num.toFixed(1)}%`;
};

export const formatBranchName = (name) => {
    if (!name) return "";
    const cleanName = String(name).trim().toUpperCase();

    const mapping = {
        'NATI': 'National Sales',
        'KNOX': 'Knoxville',
        'CLEV': 'Cleveland',
        'CHAT': 'Chattanooga',
        'DALT': 'Dalton',
        'ASHE': 'Asheville',
        'GREE': 'Greenville',
        'CHAR': 'Charlotte',
        'NATIONAL': 'National Sales'
    };

    if (mapping[cleanName]) return mapping[cleanName];

    // Title Case fallback: Capitalize first, lowercase rest
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
};

export const getBranchId = (name) => {
    if (!name) return 'KNOX';
    const cleanName = String(name).trim();

    const reverseMapping = {
        'National': 'NATI', 'National Sales': 'NATI',
        'Knoxville': 'KNOX',
        'Cleveland': 'CLEV',
        'Chattanooga': 'CHAT',
        'Dalton': 'DALT',
        'Asheville': 'ASHE',
        'Greenville': 'GREE',
        'Charlotte': 'CHAR',
        'All': 'All'
    };

    if (reverseMapping[cleanName]) return reverseMapping[cleanName];

    // If it's already a 4-char ID (and valid-ish)
    if (cleanName.length === 4 && cleanName === cleanName.toUpperCase()) return cleanName;

    return 'KNOX'; // Fallback
};
