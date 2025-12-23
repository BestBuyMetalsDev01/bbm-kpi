import React, { useMemo } from 'react';
import { formatCurrency, formatPercent, formatBranchName } from '../../utils/formatters';
import { ArrowUp, ArrowDown, MapPin } from 'lucide-react';

const LocationComparisonTable = ({
    data,
    adminSettings,
    locationKeys,
    selectedDate,
    calculateTotalWorkDays,
    calculateElapsedWorkDays,
    dateMode: mode,
    setDateMode: setMode
}) => {

    const locationData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const stats = {};
        locationKeys.forEach(loc => {
            stats[loc] = {
                name: loc,
                sales: 0,
                goal: 0,
                toDateGoal: 0,
                estDollars: 0,
                estGoal: 0,
                invoiced: 0,
                profit: 0,
                orderQty: 0,
                estQty: 0,
                invoiceQty: 0
            };
        });

        const currentMonthIndex = selectedDate.getMonth();
        const currentYear = selectedDate.getFullYear();
        const rw = parseFloat(adminSettings.daysWorked) || calculateElapsedWorkDays || 1;
        const progressRatio = rw / (calculateTotalWorkDays || 20);

        // Calculate YTD Progress Ratio (roughly)
        // If it's March, we are through Jan, Feb, and part of March.
        // Actually YTD Goal is usually sum of monthly goals up to current month.

        // 1. Calculate Goals per Location
        locationKeys.forEach(loc => {
            const g = adminSettings.locationGoals[loc] || {};
            const yearlySales = g.yearlySales || 0;

            if (mode === 'monthly') {
                const monthPct = (g.monthlyPcts && g.monthlyPcts[currentMonthIndex]) || 8.33;
                const monthlyGoal = yearlySales * (monthPct / 100);
                stats[loc].goal = monthlyGoal;
                stats[loc].toDateGoal = monthlyGoal * progressRatio;
            } else {
                // YTD Goal: Sum of monthly goals from Jan up to currentMonthIndex
                let ytdGoal = 0;
                for (let i = 0; i <= currentMonthIndex; i++) {
                    const monthPct = (g.monthlyPcts && g.monthlyPcts[i]) || 8.33;
                    ytdGoal += yearlySales * (monthPct / 100);
                }
                stats[loc].goal = ytdGoal;
                // For YTD variance, do we use a pro-rated toDate version of the CURRENT month?
                // YTD toDate = (Sum of prev months goals) + (current month goal * progressRatio)
                const prevMonthsGoal = ytdGoal - (yearlySales * (((g.monthlyPcts && g.monthlyPcts[currentMonthIndex]) || 8.33) / 100));
                stats[loc].toDateGoal = prevMonthsGoal + ((yearlySales * (((g.monthlyPcts && g.monthlyPcts[currentMonthIndex]) || 8.33) / 100)) * progressRatio);
            }
        });

        // 2. Aggregate Actuals from Data
        data.forEach(row => {
            const rawLoc = row.strDepartment;
            if (!rawLoc) return;

            // Find matching key case-insensitively
            const locMatch = locationKeys.find(k => k.toLowerCase() === rawLoc.toLowerCase());
            const rowDate = row._parsedDate;
            if (!rowDate || !locMatch || !stats[locMatch]) return;

            const isSameYear = rowDate.getFullYear() === currentYear;
            const isSameMonth = rowDate.getMonth() === currentMonthIndex;

            if (mode === 'monthly') {
                if (isSameYear && isSameMonth) {
                    stats[locMatch].sales += (row.curOrderTotals || 0);
                    stats[locMatch].estDollars += (row.curQuoted || 0);
                    stats[locMatch].invoiced += (row.curSubTotal || 0);
                    stats[locMatch].profit += (row.curInvoiceProfit || 0);
                    stats[locMatch].orderQty += (row.intOrders || 0);
                    stats[locMatch].estQty += (row.intQuotes || 0);
                }
            } else {
                // YTD
                if (isSameYear && rowDate.getMonth() <= currentMonthIndex) {
                    stats[locMatch].sales += (row.curOrderTotals || 0);
                    stats[locMatch].estDollars += (row.curQuoted || 0);
                    stats[locMatch].invoiced += (row.curSubTotal || 0);
                    stats[locMatch].profit += (row.curInvoiceProfit || 0);
                    stats[locMatch].orderQty += (row.intOrders || 0);
                    stats[locMatch].estQty += (row.intQuotes || 0);
                }
            }
        });

        // 3. Convert to Array and Calculate Derived Metrics
        return Object.values(stats).map(stat => {
            const profitPct = stat.invoiced > 0 ? (stat.profit / stat.invoiced) * 100 : 0;
            const closeRateDollar = stat.estDollars > 0 ? (stat.sales / stat.estDollars) * 100 : 0;
            const closeRateQty = stat.estQty > 0 ? (stat.orderQty / stat.estQty) * 100 : 0;

            return {
                ...stat,
                profitPct,
                closeRateDollar,
                closeRateQty
            };
        }).sort((a, b) => b.sales - a.sales); // Sort by Sales Descending

    }, [data, adminSettings, locationKeys, selectedDate, calculateTotalWorkDays, calculateElapsedWorkDays, mode]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4 font-bold">Location</th>
                            <th className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400">{mode === 'monthly' ? 'Month Sales' : 'YTD Sales'}</th>
                            <th className="px-6 py-4 text-right">Goal ({mode === 'monthly' ? 'Month' : 'YTD'})</th>
                            <th className="px-6 py-4 text-right">Variance (Total)</th>
                            <th className="px-6 py-4 text-right text-slate-400">To Date Goal</th>
                            <th className="px-6 py-4 text-right">Profit %</th>
                            <th className="px-6 py-4 text-right">Close Rate ($)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {locationData.map((row) => (
                            <tr key={row.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                    {formatBranchName(row.name)}
                                </td>
                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white text-base">
                                    {formatCurrency(row.sales)}
                                </td>
                                <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                                    <div className="flex flex-col items-end">
                                        <span>{formatCurrency(row.goal)}</span>
                                        <span className="text-[10px] text-slate-400">Target</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className={`flex flex-col items-end`}>
                                        <div className={`flex items-center justify-end gap-1 font-bold ${row.sales >= row.goal ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {row.sales >= row.goal ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            {formatCurrency(row.sales - row.goal)}
                                        </div>
                                        {/* Status indicator relative to "To Date" */}
                                        <div className={`mt-1 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full border ${row.sales >= row.toDateGoal
                                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
                                            {row.sales >= row.toDateGoal ? 'AHEAD' : 'BEHIND'}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right opacity-60">
                                    <div className="flex flex-col items-end">
                                        <span className="text-slate-600 dark:text-slate-400">{formatCurrency(row.toDateGoal)}</span>
                                        <span className={`text-[10px] font-black ${row.sales >= row.toDateGoal ? 'text-green-500' : 'text-red-500'}`}>
                                            {row.sales >= row.toDateGoal ? '+' : ''}{formatCurrency(row.sales - row.toDateGoal)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                    {formatPercent(row.profitPct)}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                    {formatPercent(row.closeRateDollar)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LocationComparisonTable;
