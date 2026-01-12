/**
 * Core calculation logic for the BBM KPI Dashboard.
 * Consolidates business logic into pure, testable functions.
 */

import { calculateTotalWorkDays, calculateElapsedWorkDays } from './dateUtils';

// ============================================================================
// SHARED HELPER FUNCTIONS
// ============================================================================

/**
 * Resolves month-specific overrides for rep settings.
 * @param {Object} repSettings - Base rep settings
 * @param {number} year - Target year
 * @param {number} month - Target month (0-indexed)
 * @returns {Object} - Rep settings with any month overrides applied
 */
export const resolveMonthOverride = (repSettings, year, month) => {
    if (!repSettings?.months) return repSettings;

    const paddedMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const unpaddedMonthKey = `${year}-${month + 1}`;
    const monthOverride = repSettings.months[paddedMonthKey] || repSettings.months[unpaddedMonthKey];

    return monthOverride ? { ...repSettings, ...monthOverride } : repSettings;
};

/**
 * Calculates a rep's monthly sales goal.
 * @param {Object} params
 * @param {Object} params.repSettings - Rep-specific settings (with overrides already applied)
 * @param {Object} params.locGoals - Location goals from adminSettings
 * @param {number} params.year - Target year
 * @param {number} params.monthIndex - Target month (0-indexed)
 * @returns {number} - The calculated monthly sales goal
 */
export const calculateMonthlyGoal = ({ repSettings, locGoals, year, monthIndex }) => {
    const targetPct = parseFloat(repSettings?.targetPct) || 0;
    const manualPersonalGoal = parseFloat(repSettings?.personalGoal);

    // If manual goal is set, use it directly
    if (!isNaN(manualPersonalGoal) && manualPersonalGoal > 0) {
        return manualPersonalGoal;
    }

    // Calculate from yearlySales × monthlyPct × targetPct
    const yearlySalesForYear = parseFloat(locGoals?.[`yearlySales${year}`]) || parseFloat(locGoals?.yearlySales) || 0;
    const monthlyPct = locGoals?.monthlyPcts?.[monthIndex] ?? 8.33;
    const branchMonthGoal = yearlySalesForYear * (monthlyPct / 100);

    return branchMonthGoal * (targetPct / 100);
};

/**
 * Filters data by user (employee ID or name).
 * @param {Array} data - Array of data rows
 * @param {Object} user - User object with employeeId and/or name
 * @returns {Array} - Filtered rows belonging to the user
 */
export const filterByUser = (data, user) => {
    if (!data || !user) return [];

    const userEmail = (user.email || '').toLowerCase();
    const userId = (user.employeeId || '').trim().toUpperCase();
    const userName = (user.name || '').trim();

    return data.filter(row => {
        const rowId = (row.strSalesperson || '').trim().toUpperCase();

        if (userId) {
            // Check for direct match or P-prefix match
            return rowId === userId || rowId === `P${userId}`;
        }

        // Fallback to name match
        return (row.strName || '').trim() === userName;
    });
};

// ============================================================================
// MAIN CALCULATION FUNCTIONS
// ============================================================================

/**
 * Filters raw data based on the selected date and period (month or YTD).
 */
export const filterDataByPeriod = (data, selectedDate, dateMode) => {
    if (!data || data.length === 0) return [];

    const targetMonth = selectedDate.getMonth();
    const targetYear = selectedDate.getFullYear();

    return data.filter(row => {
        const dDate = row._parsedDate;
        if (!dDate || isNaN(dDate.getTime())) return false;

        const rowYear = dDate.getFullYear();
        const rowMonth = dDate.getMonth();

        if (dateMode === 'ytd') {
            return rowYear === targetYear && rowMonth <= targetMonth;
        }
        return rowYear === targetYear && rowMonth === targetMonth;
    });
};

/**
 * Calculates a specific salesperson's goal and pacing metrics.
 */
export const calculateRepMetrics = (row, {
    adminSettings,
    selectedDate,
    totalDays,
    elapsedDays,
    locationTotals
}) => {
    const rowDate = row._parsedDate;
    const currentYear = rowDate ? rowDate.getFullYear() : selectedDate.getFullYear();
    const currentMonthIndex = rowDate ? rowDate.getMonth() : selectedDate.getMonth();

    // Get rep settings with month overrides applied (Scoped by Branch)
    // adminSettings.repSettings is now { [branchId]: { [repId]: settings } }
    const branchId = row.strDepartmentID || 'KNOX';
    const branchSettings = adminSettings.repSettings?.[branchId] || {};
    const baseRepSettings = branchSettings[row.strSalesperson] || {};

    const repSettings = rowDate
        ? resolveMonthOverride(baseRepSettings, currentYear, currentMonthIndex)
        : baseRepSettings;

    // Days worked for this specific calculation
    const rw = parseFloat(repSettings.daysWorked) || parseFloat(adminSettings.daysWorked) || elapsedDays || 1;
    const locGoals = adminSettings.locationGoals[branchId] || {}; // Use ID lookup

    // Calculate goal using shared helper
    const totalSalesGoal = calculateMonthlyGoal({
        repSettings,
        locGoals,
        year: currentYear,
        monthIndex: currentMonthIndex
    });

    // 2. Pro-rated Goals
    const toDateSalesGoal = totalSalesGoal * (rw / totalDays);
    const salesToMeetGoal = totalSalesGoal - row.curOrderTotals;
    const closeRateDollar = locGoals.closeRateDollar || 30;
    const estGoal = totalSalesGoal / (closeRateDollar / 100);
    const targetPct = parseFloat(repSettings.targetPct) || 0;

    return {
        ...row,
        daysWorked: rw,
        expContrib: targetPct,
        actContrib: locationTotals[row.strDepartment] > 0 ? (row.curOrderTotals / locationTotals[row.strDepartment]) * 100 : 0,
        totalSalesGoal,
        toDateSalesGoal,
        toDateVariance: row.curOrderTotals - toDateSalesGoal,
        monthlyVariance: row.curOrderTotals - totalSalesGoal,
        salesPace: rw > 0 ? (row.curOrderTotals / rw) * totalDays : 0,
        paceToGoal: totalSalesGoal > 0 ? (((row.curOrderTotals / rw) * totalDays) / totalSalesGoal) * 100 : 0,
        dailySalesGoal: (salesToMeetGoal > 0 && totalDays > rw) ? salesToMeetGoal / (totalDays - rw) : 0,
        toDateEstGoal: estGoal * (rw / totalDays),
        toDateEstQtyGoal: (locGoals.estQty || adminSettings.defaultEstQtyGoal || 20) * (rw / totalDays),
        convRateDollars: row.curQuoted > 0 ? (row.curOrderTotals / row.curQuoted) * 100 : 0,
        convRateQty: row.intQuotes > 0 ? (row.intOrders / row.intQuotes) * 100 : 0
    };
};

/**
 * Aggregates summary data for a branch or the entire company.
 */
export const calculateBranchSummary = (processedRows, {
    selectedLocation,
    adminSettings,
    selectedDate,
    dateMode,
    totalDays,
    elapsedDays
}) => {
    let summaryGoal = 0;
    let summaryToDateGoal = 0;
    let summaryEstGoal = 0;
    let summaryToDateEstGoal = 0;
    let summaryEstQtyGoal = 0;

    let targetProfitPct = 0;
    let targetDollarConv = 0;
    let targetQtyConv = 0;

    const currentMonthIndex = selectedDate.getMonth();
    const progressRatio = elapsedDays / totalDays;
    const isCompanyContext = selectedLocation === 'All';

    // 1. Calculate Goals
    const locsToSum = isCompanyContext
        ? Object.values(adminSettings.locationGoals)
        : [adminSettings.locationGoals[selectedLocation] || {}];

    locsToSum.forEach(g => {
        const closeRate = (g.closeRateDollar || 30) / 100;

        // Support year-specific yearly sales: yearlySales2024, yearlySales2025, etc.
        const currentYear = selectedDate.getFullYear();
        const yearlySalesForYear = parseFloat(g[`yearlySales${currentYear}`]) || parseFloat(g.yearlySales) || 0;

        if (dateMode === 'ytd') {
            let locYtdGoal = 0;
            let locToDateGoal = 0;
            for (let i = 0; i <= currentMonthIndex; i++) {
                const monthPct = (g.monthlyPcts && g.monthlyPcts[i]) || 8.33;
                const monthlySG = yearlySalesForYear * (monthPct / 100);

                locYtdGoal += monthlySG;
                if (i < currentMonthIndex) {
                    locToDateGoal += monthlySG;
                } else {
                    locToDateGoal += monthlySG * progressRatio;
                }
            }
            summaryGoal += locYtdGoal;
            summaryToDateGoal += locToDateGoal;
            summaryEstGoal += locYtdGoal / closeRate;
            summaryToDateEstGoal += locToDateGoal / closeRate;
            summaryEstQtyGoal += (parseFloat(g.estQty) || 0) * (currentMonthIndex + 1) / 12;
        } else {
            const monthPct = (g.monthlyPcts && g.monthlyPcts[currentMonthIndex]) || 8.33;
            const sg = yearlySalesForYear * (monthPct / 100);
            summaryGoal += sg;
            summaryToDateGoal += sg * progressRatio;
            summaryEstGoal += sg / closeRate;
            summaryToDateEstGoal += (sg * progressRatio) / closeRate;
            summaryEstQtyGoal += (parseFloat(g.estQty) || 0);
        }
    });

    // Handle averaging targets for company view
    if (locsToSum.length > 0) {
        targetProfitPct = locsToSum.reduce((s, l) => s + (l.profitGoal || 0), 0) / locsToSum.length;
        targetDollarConv = locsToSum.reduce((s, l) => s + (l.closeRateDollar || 30), 0) / locsToSum.length;
        targetQtyConv = locsToSum.reduce((s, l) => s + (l.closeRateQty || 0), 0) / locsToSum.length;
    }

    // 2. Sum Actuals
    const actuals = processedRows.reduce((acc, row) => ({
        sales: acc.sales + (row.curOrderTotals || 0),
        orderQty: acc.orderQty + (row.intOrders || 0),
        estDollars: acc.estDollars + (row.curQuoted || 0),
        estQty: acc.estQty + (row.intQuotes || 0),
        invoiced: acc.invoiced + (row.curSubTotal || 0),
        profit: acc.profit + (row.curInvoiceProfit || 0),
        invoiceQty: acc.invoiceQty + (row.intInvoices || 0),
    }), { sales: 0, orderQty: 0, estDollars: 0, estQty: 0, invoiced: 0, profit: 0, invoiceQty: 0 });

    const remainingDays = Math.max(0, totalDays - elapsedDays);

    return {
        totalSalesGoal: summaryGoal,
        sales: actuals.sales,
        toDateSalesGoal: summaryToDateGoal,
        salesVariance: actuals.sales - summaryToDateGoal,
        monthlyVariance: actuals.sales - summaryGoal,
        salesToMeet: Math.max(0, summaryGoal - actuals.sales),
        dailyGoal: remainingDays > 0 ? Math.max(0, summaryGoal - actuals.sales) / remainingDays : 0,
        estDollars: actuals.estDollars,
        estGoal: summaryEstGoal,
        toDateEstGoal: summaryToDateEstGoal,
        estVariance: actuals.estDollars - summaryToDateEstGoal,
        dailyEstGoal: remainingDays > 0 ? Math.max(0, summaryEstGoal - actuals.estDollars) / remainingDays : 0,
        estQty: actuals.estQty,
        toDateEstQtyGoal: summaryEstQtyGoal * progressRatio,
        invoiced: actuals.invoiced,
        profit: actuals.profit,
        actualProfitPct: actuals.invoiced > 0 ? (actuals.profit / actuals.invoiced) * 100 : 0,
        targetProfitPct,
        actualDollarConv: actuals.estDollars > 0 ? (actuals.sales / actuals.estDollars) * 100 : 0,
        targetDollarConv,
        actualQtyConv: actuals.estQty > 0 ? (actuals.orderQty / actuals.estQty) * 100 : 0,
        targetQtyConv,
        orderQty: actuals.orderQty
    };
};

/**
 * Calculates streaks and total "wins" (hit goals) for a salesperson.
 */
export const calculateRepStreaks = (myHistory, adminSettings) => {
    if (!myHistory || myHistory.length === 0) return { totalWins: 0, currentStreak: 0, longestStreak: 0 };

    // 1. Sort history by date ascending
    const sorted = [...myHistory].sort((a, b) => (a._parsedDate || 0) - (b._parsedDate || 0));

    let totalWins = 0;
    let currentStreak = 0;
    let longestStreak = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    sorted.forEach(row => {
        if (!row._parsedDate) return;

        const rowMonth = row._parsedDate.getMonth();
        const rowYear = row._parsedDate.getFullYear();

        // Skip future months
        if (rowYear > currentYear || (rowYear === currentYear && rowMonth > currentMonth)) return;

        // Get rep settings with month overrides applied
        const baseRepSettings = adminSettings.repSettings?.[row.strSalesperson] || {};
        const repSettings = resolveMonthOverride(baseRepSettings, rowYear, rowMonth);

        const locGoals = adminSettings.locationGoals[row.strDepartment] || {};

        // Calculate goal using shared helper
        const monthlySalesGoal = calculateMonthlyGoal({
            repSettings,
            locGoals,
            year: rowYear,
            monthIndex: rowMonth
        });

        const hasWon = row.curOrderTotals >= monthlySalesGoal && monthlySalesGoal > 0;
        const isCurrentMonth = rowMonth === currentMonth && rowYear === currentYear;

        if (hasWon) {
            totalWins++;
            currentStreak++;
            if (currentStreak > longestStreak) longestStreak = currentStreak;
        } else {
            // Only break the streak if it's a PAST month.
            // If it's the current month and they haven't hit it yet, the streak 
            // is "frozen" at the previous level until the month ends.
            if (!isCurrentMonth) {
                currentStreak = 0;
            }
        }
    });

    return { totalWins, currentStreak, longestStreak };
};
