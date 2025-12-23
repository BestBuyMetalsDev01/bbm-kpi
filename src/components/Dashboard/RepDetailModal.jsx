import React from 'react';
import { X, TrendingUp, DollarSign, Target, Award, MapPin, Calendar, Globe, Quote, BarChart2, User as UserIcon } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, formatBranchName } from '../../utils/formatters';
import GoalVisualizer from './GoalVisualizer';
import TrendChart from './TrendChart';

const RepDetailModal = ({ isOpen, onClose, repData, fullHistory, adminSettings, selectedDate, monthName }) => {
    if (!isOpen || !repData) return null;

    // Filter history for this rep
    const myHistory = fullHistory.filter(row =>
        row.strSalesperson === repData.strSalesperson ||
        row.strSalesperson === `P${repData.strSalesperson}` ||
        row.strName === repData.strName
    );

    const today = new Date();
    const currentYear = today.getFullYear();

    // Calculate YTD from history
    const calculatedYTD = myHistory.reduce((acc, row) => {
        const d = row._parsedDate;
        if (!d) return acc;
        return d.getFullYear() === currentYear ? acc + (row.curOrderTotals || 0) : acc;
    }, 0);

    const metrics = {
        sales: repData.curOrderTotals || 0,
        ytd: calculatedYTD,
        quoteAmt: repData.curQuoteTotals || 0,
        quoteCount: repData.curQuoteQty || 0,
        orderCount: repData.intOrders || 0,
        profit: repData.curInvoiceProfit || 0,
        invoiced: repData.curSubTotal || 0,
        goal: repData.toDateSalesGoal || 0,
        totalGoal: repData.totalSalesGoal || 0,
        variance: repData.monthlyVariance || 0,
        pace: repData.salesPace || 0,
        paceToGoal: repData.paceToGoal || 0,
        profitPct: repData.grossProfitPct || 0,
        closeRate: repData.closeRateDollar || 0
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-6xl max-h-full overflow-y-auto rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">

                {/* Header */}
                <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                            <UserIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                {repData.strName}
                            </h2>
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mt-1">
                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                {formatBranchName(repData.strDepartment)}
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="text-blue-500">ID: {repData.strSalesperson}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all transform hover:rotate-90 active:scale-95 shadow-sm"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Top Stats & Visualizers */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Goal Card */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Award className="w-48 h-48" />
                            </div>
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                        <Target className="w-4 h-4 text-blue-400" />
                                        Monthly Progress ({monthName})
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-slate-500 text-sm font-bold">ACTUAL SALES</p>
                                            <p className="text-4xl font-black">{formatCurrency(metrics.sales)}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <p className="text-slate-500 text-[10px] font-bold uppercase">Monthly Goal</p>
                                                <p className="text-lg font-bold text-slate-300">{formatCurrency(metrics.totalGoal)}</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-black ${metrics.variance >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {metrics.variance >= 0 ? '+' : ''}{formatCurrency(metrics.variance)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-center">
                                    <GoalVisualizer
                                        current={metrics.sales}
                                        target={metrics.totalGoal}
                                        size={200}
                                        strokeWidth={16}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Secondary Metrics Widget */}
                        <div className="bg-white dark:bg-slate-800/50 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col justify-between">
                            <div className="space-y-6">
                                <MetricRow label="YTD Sales" value={formatCurrency(metrics.ytd)} icon={<Globe className="w-4 h-4 text-blue-500" />} />
                                <MetricRow label="Monthly Pace" value={formatCurrency(metrics.pace)} icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} />
                                <MetricRow label="Profit Margin" value={formatPercent(metrics.profitPct)} icon={<DollarSign className="w-4 h-4 text-amber-500" />} highlight />
                                <MetricRow label="Close Rate" value={formatPercent(metrics.closeRate)} icon={<BarChart2 className="w-4 h-4 text-purple-500" />} highlight />
                            </div>
                        </div>
                    </div>

                    {/* Detailed Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <MiniCard label="Orders" value={metrics.orderCount} sub="Counts" color="blue" />
                        <MiniCard label="Quotes" value={metrics.quoteCount} sub="Created" color="indigo" />
                        <MiniCard label="Quote $" value={formatCurrency(metrics.quoteAmt)} sub="Total Value" color="purple" />
                        <MiniCard label="Profit $" value={formatCurrency(metrics.profit)} sub="Est. Contribution" color="emerald" />
                    </div>

                    {/* Trend Chart */}
                    <TrendChart data={myHistory} location={repData.strDepartment} repName={repData.strName} />
                </div>
            </div>
        </div>
    );
};

const MetricRow = ({ label, value, icon, highlight }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                {icon}
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{label}</span>
        </div>
        <span className={`text-lg font-black ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
            {value}
        </span>
    </div>
);

const MiniCard = ({ label, value, sub, color }) => {
    const colors = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30',
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-100 dark:border-indigo-900/30',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-100 dark:border-purple-900/30',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30'
    };
    return (
        <div className={`p-6 rounded-2xl border ${colors[color]} shadow-sm`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
            <p className="text-xl font-black">{value}</p>
            <p className="text-[10px] font-bold opacity-40 mt-1 uppercase">{sub}</p>
        </div>
    );
};

export default RepDetailModal;
