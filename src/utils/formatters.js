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
    const cleanName = String(name).trim();
    if (cleanName.toUpperCase() === 'NATIONAL') return 'National Sales';
    // Title Case: Capitalize first, lowercase rest
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
};
