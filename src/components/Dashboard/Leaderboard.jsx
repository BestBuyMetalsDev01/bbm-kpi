import React from 'react';
import { Trophy, Award, TrendingUp, Users } from 'lucide-react';
import { formatCurrency, formatPercent, formatBranchName } from '../../utils/formatters';

const Leaderboard = ({ processedData, productsData = [] }) => {
    // Top 5 Revenue Leaders from processedData
    const revenueLeaders = [...processedData]
        .filter(r => !r.isMisc && r.strSalesperson !== 'ECOMMERCE')
        .sort((a, b) => b.curOrderTotals - a.curOrderTotals)
        .slice(0, 5);

    // Helper to find value by flexible key (case-insensitive, ignores spaces)
    const getVal = (obj, key) => {
        if (!obj || !key) return null;
        const cleanKey = key.toLowerCase().replace(/\s/g, '');
        const foundKey = Object.keys(obj).find(k => k.toLowerCase().replace(/\s/g, '') === cleanKey);
        return foundKey ? obj[foundKey] : null;
    };

    // Create a lookup map for representative info (names/branches) from main data
    const repInfoMap = React.useMemo(() => {
        const map = new Map();
        processedData.forEach(rep => {
            if (rep.strSalesperson && !rep.isMisc) {
                map.set(rep.strSalesperson, {
                    name: rep.strName,
                    branch: rep.strDepartment
                });
            }
        });
        return map;
    }, [processedData]);

    // Product of the Month Data
    // Column Names: "Salesperson", "Salesperson ID", "Qty Ordered", "Product"
    const productMonthReps = React.useMemo(() => {
        return productsData
            .filter(r => {
                const sid = getVal(r, 'Salesperson ID') || getVal(r, 'SalespersonID') || '';
                return sid !== 'ECOMMERCE' && sid !== '';
            })
            .map(r => {
                const sid = getVal(r, 'Salesperson ID') || getVal(r, 'SalespersonID');
                const info = repInfoMap.get(sid);
                return {
                    ...r,
                    displayName: info?.name || getVal(r, 'Salesperson') || sid || "Unknown Rep",
                    displayBranch: info?.branch || getVal(r, 'Location') || getVal(r, 'Department') || "BBM branch"
                };
            })
            .sort((a, b) => {
                const qtyA = parseFloat(getVal(a, 'Qty Ordered') || 0) || 0;
                const qtyB = parseFloat(getVal(b, 'Qty Ordered') || 0) || 0;
                return qtyB - qtyA;
            });
    }, [productsData, repInfoMap]);

    // Logging for Product of the Month Data
    React.useEffect(() => {
        console.group('Product of the Month Data Debug');
        console.log('Raw productsData Received:', productsData);
        if (productsData.length > 0) {
            console.log('Available Columns (First Row):', Object.keys(productsData[0]));
        }
        console.log('Filtered/Enriched productMonthReps:', productMonthReps);
        console.groupEnd();
    }, [productsData, productMonthReps]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                    <Trophy className="w-64 h-64 text-amber-500" />
                </div>

                <div className="relative z-10">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                        Company <span className="text-amber-500">Leaderboards</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                        Celebrating our top performers and product champions across all BBM locations.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product of the Month Leaderboard */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Product of the Month</h3>
                                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Top Performers</p>
                                </div>
                            </div>
                            {productMonthReps.length > 0 && (
                                <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                                    {getVal(productMonthReps[0], 'Product') || "Specialty Product"}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-2">
                        {productMonthReps.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {productMonthReps.slice(0, 5).map((rep, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-400 text-amber-950 ring-4 ring-amber-400/20' :
                                            i === 1 ? 'bg-slate-300 text-slate-900' :
                                                i === 2 ? 'bg-orange-400 text-orange-950' :
                                                    'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                            }`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 dark:text-white leading-none">{rep.displayName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{formatBranchName(rep.displayBranch)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-blue-600 dark:text-blue-400">{getVal(rep, 'Qty Ordered') || 0}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty Ordered</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No product data found for this period</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Revenue Leaders Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Revenue Leaders</h3>
                                <p className="text-amber-100 text-xs font-bold uppercase tracking-widest">MTD Rankings</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-2">
                        {revenueLeaders.map((leader, i) => (
                            <div key={leader.strSalesperson} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-400 text-amber-950' :
                                    i === 1 ? 'bg-slate-300 text-slate-900' :
                                        i === 2 ? 'bg-orange-400 text-orange-950' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-900 dark:text-white leading-none">{leader.strName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{formatBranchName(leader.strDepartment)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-amber-600 dark:text-amber-500">{formatCurrency(leader.curOrderTotals)}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MTD Total</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
