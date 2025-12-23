import React, { useState, useEffect } from 'react';
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
import { formatCurrency } from '../../utils/formatters';

const LocationTrendChart = ({ data, selectedDate }) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!data || data.length === 0) return <div className="p-8 text-center text-slate-400">No data available for comparison.</div>;

    const transformData = () => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const locations = new Set();
        const monthlyData = {};
        const targetYear = selectedDate.getFullYear();

        // Initialize months
        monthNames.forEach(m => monthlyData[m] = { name: m });

        data.forEach(row => {
            const date = row._parsedDate;
            if (!date || isNaN(date.getTime())) return;
            if (date.getFullYear() !== targetYear) return;

            const loc = row.strDepartment;
            const month = monthNames[date.getMonth()];
            locations.add(loc);

            if (!monthlyData[month][loc]) monthlyData[month][loc] = 0;
            monthlyData[month][loc] += (row.curOrderTotals || 0);
        });

        return {
            chartData: Object.values(monthlyData),
            locations: Array.from(locations).sort(),
            targetYear
        };
    };

    const { chartData, locations, targetYear } = transformData();
    const colors = [
        '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
        '#06b6d4', '#6366f1', '#f43f5e', '#fbbf24', '#2dd4bf'
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                Location Comparison ({targetYear})
                <span className="text-xs font-normal text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                    By Store
                </span>
            </h3>

            {isMounted ? (
                <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            formatter={(value) => formatCurrency(value)}
                            labelStyle={{ fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}
                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ paddingTop: '20px' }}
                        />
                        {locations.map((loc, index) => (
                            <Line
                                key={loc}
                                type="monotone"
                                dataKey={loc}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={{ r: 3, fill: colors[index % colors.length], strokeWidth: 1, stroke: '#fff' }}
                                activeDot={{ r: 5 }}
                                connectNulls
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="w-full h-[85%] flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

export default LocationTrendChart;
