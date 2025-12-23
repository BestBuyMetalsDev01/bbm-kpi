import React, { useState, useMemo } from 'react';
import { Search, User as UserIcon, TrendingUp, DollarSign, MapPin, ArrowRight, Star, BarChart3, Users, Award } from 'lucide-react';
import { formatCurrency, formatBranchName, formatPercent } from '../../utils/formatters';

const ExecutiveDashboard = ({ data, processedData, onRepClick }) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Get all unique reps from the raw data
    const allReps = useMemo(() => {
        const repMap = new Map();

        // Use processedData first as it has current metrics
        processedData.forEach(rep => {
            if (!rep.isMisc && rep.strSalesperson !== 'ECOMMERCE') {
                repMap.set(rep.strSalesperson, {
                    id: rep.strSalesperson,
                    name: rep.strName,
                    department: rep.strDepartment,
                    currentSales: rep.curOrderTotals,
                    goal: rep.totalSalesGoal,
                    pace: rep.paceToGoal,
                    isCurrent: true,
                    fullData: rep
                });
            }
        });

        return Array.from(repMap.values()).sort((a, b) => b.currentSales - a.currentSales);
    }, [processedData]);

    const filteredReps = allReps.filter(rep =>
        rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Search Header */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                    <BarChart3 className="w-64 h-64 text-blue-500" />
                </div>

                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                        Executive <span className="text-blue-600">Rep Lookup</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                        Search and analyze performance data for any salesperson across all branches.
                        Click on a rep to see their individual deep-dive analytics.
                    </p>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                            <Search className="w-6 h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, ID, or location..."
                            className="block w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-lg font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Top Performers Bar */}
            {!searchQuery && (
                <div className="bg-slate-900 dark:bg-blue-950/20 rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                    <div className="absolute top-0 left-0 p-4 opacity-10">
                        <TrendingUp className="w-24 h-24 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-white flex items-center gap-3">
                            <Award className="w-6 h-6 text-amber-500" />
                            Performance Leaders
                        </h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Top 3 Salespeople by MTD Revenue</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 relative z-10">
                        {allReps.slice(0, 3).map((leader, i) => (
                            <div
                                key={leader.id}
                                onClick={() => onRepClick(leader.fullData)}
                                className="bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group"
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-500 text-amber-950' : i === 1 ? 'bg-slate-300 text-slate-900' : 'bg-orange-400 text-orange-950'}`}>
                                    {i + 1}
                                </div>
                                <div>
                                    <p className="text-white font-black text-sm leading-tight group-hover:text-blue-400 transition-colors">{leader.name}</p>
                                    <p className="text-blue-400 font-bold text-[10px] uppercase tracking-tighter">{formatCurrency(leader.currentSales)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredReps.length > 0 ? (
                    filteredReps.map((rep) => (
                        <RepCard
                            key={rep.id}
                            rep={rep}
                            onClick={() => onRepClick(rep.fullData)}
                        />
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Salespeople Found</h3>
                        <p className="text-slate-500 dark:text-slate-400">Try adjusting your search terms.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const RepCard = ({ rep, onClick }) => {
    const isOverGoal = rep.pace >= 100;

    return (
        <button
            onClick={onClick}
            className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 text-left transition-all hover:shadow-2xl hover:-translate-y-1 hover:border-blue-500/30 dark:hover:border-blue-500/20 active:scale-[0.98]"
        >
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm overflow-hidden">
                        <UserIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                            {rep.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            <MapPin className="w-3 h-3" />
                            {formatBranchName(rep.department)}
                        </div>
                    </div>
                </div>
                {isOverGoal && (
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600 dark:text-amber-400 shadow-sm">
                        <Star className="w-5 h-5 fill-current" />
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mtd Sales</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(rep.currentSales)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pace</p>
                        <p className={`text-lg font-black ${rep.pace >= 100 ? 'text-green-600' : rep.pace >= 80 ? 'text-blue-600' : 'text-slate-500'}`}>
                            {formatPercent(rep.pace)}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div
                        className={`h-full transition-all duration-1000 ${rep.pace >= 100 ? 'bg-green-500' : rep.pace >= 80 ? 'bg-blue-500' : 'bg-slate-400'}`}
                        style={{ width: `${Math.min(rep.pace, 100)}%` }}
                    />
                </div>

                <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        ID: {rep.id}
                    </span>
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-2 transition-all">
                        View Details <ArrowRight className="w-3 h-3" />
                    </div>
                </div>
            </div>
        </button>
    );
};

export default ExecutiveDashboard;
