import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { formatCurrency, formatBranchName } from '../../utils/formatters';
import { History } from 'lucide-react';

const CompanyMultiYearChart = ({ data }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const { chartData, series } = useMemo(() => {
        if (!data || data.length === 0) return { chartData: [], series: [] };

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyMap = monthNames.map(m => ({ month: m }));
        const seriesSet = new Set();
        const years = new Set();

        data.forEach(row => {
            const date = row._parsedDate;
            if (!date || isNaN(date.getTime())) return;

            const year = date.getFullYear();
            const monthIdx = date.getMonth();
            const loc = row.strDepartment;
            if (!loc) return;

            const key = `${loc}_${year}`;
            seriesSet.add(key);
            years.add(year);

            if (!monthlyMap[monthIdx][key]) {
                monthlyMap[monthIdx][key] = 0;
            }
            monthlyMap[monthIdx][key] += (row.curOrderTotals || 0);
        });

        // Convert to array and sort series
        const allSeries = Array.from(seriesSet).sort((a, b) => {
            const [locA, yearA] = a.split('_');
            const [locB, yearB] = b.split('_');
            if (locA !== locB) return locA.localeCompare(locB);
            return parseInt(yearA) - parseInt(yearB);
        });

        return {
            chartData: monthlyMap,
            series: allSeries,
            latestYear: Math.max(...Array.from(years))
        };
    }, [data]);

    const colors = [
        '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
        '#06b6d4', '#6366f1', '#f43f5e', '#fbbf24', '#2dd4bf'
    ];

    // Helper to get location color
    const getLocColor = (seriesKey) => {
        const loc = seriesKey.split('_')[0];
        const uniqueLocs = Array.from(new Set(series.map(s => s.split('_')[0]))).sort();
        const idx = uniqueLocs.indexOf(loc);
        return colors[idx % colors.length];
    };

    if (!data || data.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl h-[650px] flex flex-col">
            <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                        <History className="w-6 h-6" />
                    </div>
                    Multi-Year Growth Comparison <span className="text-slate-400 font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs">All Branches</span>
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Monthly revenue trends for every branch, compared side-by-side across all historical years.</p>
            </div>

            <div className="flex-1 min-h-0 relative">
                {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }}
                                dy={15}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    borderRadius: '16px',
                                    border: 'none',
                                    padding: '16px',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                }}
                                itemStyle={{ padding: '2px 0' }}
                                labelStyle={{ color: '#fff', fontWeight: 900, marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                formatter={(value, name) => {
                                    const [loc, year] = name.split('_');
                                    return [
                                        <span className="font-bold text-white text-sm">{formatCurrency(value)}</span>,
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{formatBranchName(loc)} ({year})</span>
                                    ];
                                }}
                            />
                            <Legend
                                iconType="line"
                                wrapperStyle={{ paddingTop: '40px' }}
                                formatter={(value) => {
                                    const [loc, year] = value.split('_');
                                    return <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter ml-1">{formatBranchName(loc)} '{year.substring(2)}</span>
                                }}
                            />
                            {series.map((s) => {
                                const [loc, year] = s.split('_');
                                const isCurrentYear = parseInt(year) === new Date().getFullYear();
                                const color = getLocColor(s);

                                return (
                                    <Line
                                        key={s}
                                        type="monotone"
                                        dataKey={s}
                                        name={s}
                                        stroke={color}
                                        strokeWidth={isCurrentYear ? 3 : 1.5}
                                        strokeOpacity={isCurrentYear ? 1 : 0.4}
                                        strokeDasharray={isCurrentYear ? "0" : "5 5"}
                                        dot={false}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                        animationDuration={1500}
                                        connectNulls
                                    />
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanyMultiYearChart;


