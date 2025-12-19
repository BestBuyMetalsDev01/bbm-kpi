export const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(val || 0);

export const formatNumber = (val) =>
    new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0
    }).format(val || 0);

export const formatPercent = (val) => `${(val || 0).toFixed(1)}%`;
