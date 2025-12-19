import React from 'react';
import { TrendingUp, DollarSign, Activity, Target, PieChart, CreditCard, Percent, FileText } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const MiniStat = ({ label, value, goal, success, color }) => {
    let styleClass = "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300";
    let iconColor = "text-slate-400";

    if (success === true) {
        styleClass = "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400";
        iconColor = "text-green-500";
    } else if (success === false) {
        styleClass = "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400";
        iconColor = "text-red-500";
    }

    return (
        <div className={`p-3 rounded-xl border ${styleClass} transition-all duration-300 hover:shadow-md`}>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">{label}</div>
            <div className="text-lg font-bold flex items-baseline gap-1">
                {value}
                {goal && <span className="text-[10px] font-normal opacity-60 ml-1">{goal}</span>}
            </div>
        </div>
    );
};

const SummaryCards = ({ branchSummary }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* CARD 1: SALES PERFORMANCE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sales Performance</h3>
                        <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(branchSummary.sales)}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <MiniStat label="Monthly Goal" value={formatCurrency(branchSummary.totalSalesGoal)} />
                    <MiniStat label="To Date Goal" value={formatCurrency(branchSummary.toDateSalesGoal)} />
                    <MiniStat label="Variance" value={formatCurrency(branchSummary.salesVariance)} success={branchSummary.salesVariance >= 0} />
                    <MiniStat label="Daily Needed" value={formatCurrency(branchSummary.dailyGoal)} color="blue" />
                </div>
            </div>

            {/* CARD 2: ESTIMATES PIPELINE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Estimates Pipeline</h3>
                        <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(branchSummary.estDollars)}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <MiniStat label="Dollar Goal" value={formatCurrency(branchSummary.estGoal)} />
                    <MiniStat label="To Date Goal" value={formatCurrency(branchSummary.toDateEstGoal)} />
                    <MiniStat
                        label="$ Conv. Rate"
                        value={formatPercent(branchSummary.actualDollarConv)}
                        goal={`Goal: ${branchSummary.targetDollarConv}%`}
                        success={branchSummary.actualDollarConv >= branchSummary.targetDollarConv}
                    />
                    <MiniStat
                        label="Qty Conv. Rate"
                        value={formatPercent(branchSummary.actualQtyConv)}
                        goal={`Goal: ${branchSummary.targetQtyConv}%`}
                        success={branchSummary.actualQtyConv >= branchSummary.targetQtyConv}
                    />
                </div>
            </div>

            {/* CARD 3: FINANCIALS & MARGINS */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                        <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Financials & Margins</h3>
                        <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatPercent(branchSummary.actualProfitPct)} Margin</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <MiniStat label="Total Profit" value={formatCurrency(branchSummary.profit)} success={branchSummary.actualProfitPct >= branchSummary.targetProfitPct} />
                    <MiniStat label="Profit Goal" value={`${branchSummary.targetProfitPct}%`} />
                    <MiniStat label="Invoiced" value={formatCurrency(branchSummary.invoiced)} />
                    <MiniStat label="Order Qty" value={branchSummary.orderQty} />
                </div>
            </div>
        </div>
    );
};

export default SummaryCards;
