import { TrendingUp, DollarSign, Target, Award, MapPin, Calendar, Globe } from 'lucide-react';
import { formatCurrency, formatNumber, formatBranchName } from '../../utils/formatters';
import GoalVisualizer from './GoalVisualizer';
import TrendChart from './TrendChart';

const IndividualPanel = ({
    processedData,
    fullHistory = [],
    branchSummary,
    user,
    monthName,
    adminSettings,
    selectedDate
}) => {
    // 1. Filter metrics (Current view)
    const myData = processedData.filter(row => {
        if (user.employeeId) return row.strSalesperson === user.employeeId || row.strSalesperson === `P${user.employeeId}`;
        return row.strName === user.name;
    });

    // Filter FULL history for this user (for trends)
    const myHistory = fullHistory.filter(row => {
        if (user.employeeId) return row.strSalesperson === user.employeeId || row.strSalesperson === `P${user.employeeId}`;
        return row.strName === user.name;
    });

    // History Logic
    const today = new Date();
    const currentYear = today.getFullYear();
    const lastYear = currentYear - 1;

    // 1. Lifetime Sales (Sum of ALL history)
    const lifetimeSales = myHistory.reduce((acc, row) => acc + (row.curOrderTotals || 0), 0);

    // 2. Calculated YTD (Sum of Current Year from History)
    // This ensures we only count rows from the actual current year
    const calculatedYTD = myHistory.reduce((acc, row) => {
        const d = row._parsedDate;
        if (!d) return acc;
        return d.getFullYear() === currentYear ? acc + (row.curOrderTotals || 0) : acc;
    }, 0);

    // 3. Last Year Comparison
    const sameMonthLastYear = myHistory.find(row => {
        const d = row._parsedDate;
        if (!d) return false;
        return d.getMonth() === today.getMonth() && d.getFullYear() === lastYear;
    });
    const lastYearSales = sameMonthLastYear ? sameMonthLastYear.curOrderTotals : 0;
    const yoyGrowth = lastYearSales > 0 ? ((myData[0]?.curOrderTotals || 0) - lastYearSales) / lastYearSales * 100 : 0;

    // 4. Aggregate "My" Metrics (Current Month View)
    const myMetrics = myData.reduce((acc, row) => ({
        sales: acc.sales + (row.curOrderTotals || 0),
        ytd: calculatedYTD, // Strictly use calculated YTD from history (No fallback to bad column)
        quoteAmt: acc.quoteAmt + (row.curQuoted || 0),
        quoteCount: acc.quoteCount + (row.intQuotes || 0),
        orderCount: acc.orderCount + (row.intOrders || 0),
        profit: acc.profit + (row.curInvoiceProfit || 0),
        invoiced: acc.invoiced + (row.curSubTotal || 0),
        goal: acc.goal + (row.toDateSalesGoal || 0), // Keeping 'goal' as toDate for potential other uses, but typically we want total
        totalGoal: acc.totalGoal + (row.totalSalesGoal || 0) // Explicitly aggregating the monthly TOTAL goal
    }), { sales: 0, ytd: 0, quoteAmt: 0, quoteCount: 0, orderCount: 0, profit: 0, invoiced: 0, goal: 0, totalGoal: 0 });

    // 3. Calculate Derived Metrics
    // Contribution: My Sales / Branch Total Sales
    const branchSales = branchSummary?.sales || 1; // Prevent div/0
    const contributionPct = (myMetrics.sales / branchSales) * 100;

    // Profit %: My Profit / My Invoiced
    const myProfitPct = myMetrics.invoiced > 0 ? (myMetrics.profit / myMetrics.invoiced) * 100 : 0;

    // Close Rate: My Orders / My Quotes (Count) based on filtered monthly metrics
    const closeRate = myMetrics.quoteCount > 0 ? (myMetrics.orderCount / myMetrics.quoteCount) * 100 : 0;

    // 4. Personal Goal (Manual)
    const currentMonthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
    const personalGoal = adminSettings.repSettings?.[user.employeeId]?.months?.[currentMonthKey]?.personalGoal
        ?? adminSettings.repSettings?.[user.employeeId]?.personalGoal
        ?? 0;

    const displayBranch = formatBranchName(user.Department);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header / Welcome and Visualizers */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Award className="w-64 h-64" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                            Welcome, {user.name?.split(' ')[0]}! 👋
                        </h2>
                        <p className="text-slate-400 font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            {displayBranch} Branch
                            <span className="text-slate-600">•</span>
                            <Calendar className="w-4 h-4 text-purple-400" />
                            {monthName} Performance
                        </p>
                    </div>
                </div>

                {/* Goal Visualizers */}
                <div className="flex gap-4 overflow-x-auto pb-2 lg:pb-0">
                    <GoalVisualizer
                        current={myMetrics.sales}
                        target={myMetrics.totalGoal} // Use Total Monthly Goal
                        label="Location Goal"
                        icon={Target}
                        colorClass="stroke-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                    />
                    {personalGoal > 0 && (
                        <GoalVisualizer
                            current={myMetrics.sales}
                            target={personalGoal}
                            label="Personal Goal"
                            icon={Globe}
                            colorClass="stroke-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                        />
                    )}
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {/* 1. My Sales (Current Month) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign className="w-24 h-24" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">My Sales (Month)</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                        {formatCurrency(myMetrics.sales)}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded w-fit">
                        <TrendingUp className="w-3 h-3" />
                        {contributionPct.toFixed(1)}% of Store ({formatCurrency(branchSales)})
                    </div>
                </div>

                {/* 2. My Sales (YTD) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Award className="w-24 h-24" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">My Sales (YTD)</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                        {formatCurrency(myMetrics.ytd)}
                    </h3>
                    <div className="text-xs text-slate-400">
                        Total sales for the year
                    </div>
                </div>

                {/* 3. Close Rate */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target className="w-24 h-24" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Close Rate</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                        {closeRate.toFixed(1)}%
                    </h3>
                    <div className="text-xs text-slate-400">
                        {myMetrics.orderCount} Orders / {myMetrics.quoteCount} Quotes
                    </div>
                </div>

                {/* 4. Lifetime Sales */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Globe className="w-24 h-24" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Lifetime Sales</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                        {formatCurrency(lifetimeSales)}
                    </h3>
                    <div className="text-xs text-slate-400">
                        Total sales since joining
                    </div>
                </div>

                {/* 5. Profit Margin */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-lg relative overflow-hidden group hover:border-orange-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar className="w-24 h-24" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">vs Last Year ({lastYear})</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                        {formatCurrency(lastYearSales)}
                    </h3>
                    <div className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded w-fit ${yoyGrowth >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {yoyGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                        {Math.abs(yoyGrowth).toFixed(1)}% {yoyGrowth >= 0 ? 'Increase' : 'Decrease'}
                    </div>
                </div>
            </div>

            {/* Trend Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TrendChart data={myHistory} />
                </div>

                {/* Recent Activity / Detailed Table */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Current Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Category / ID</th>
                                    <th className="px-4 py-3 text-right">Sales (Month)</th>
                                    <th className="px-4 py-3 text-right">Sales (YTD)</th>
                                    <th className="px-4 py-3 text-right">Quotes</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Close Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {myData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                                            {row.strName}
                                            {row.strSalesperson && <span className="ml-2 text-xs text-slate-400 font-normal">({row.strSalesperson})</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">{formatCurrency(row.curOrderTotals)}</td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(row.curOrderTotalsYTD)}</td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{formatNumber(row.intQuotes)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-600">
                                            {row.curQuoted > 0 ? ((row.curOrderTotals / row.curQuoted) * 100).toFixed(1) : '0.0'}%
                                        </td>
                                    </tr>
                                ))}
                                {myData.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                                            No data found for your Employee ID ({user.employeeId}).
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndividualPanel;
