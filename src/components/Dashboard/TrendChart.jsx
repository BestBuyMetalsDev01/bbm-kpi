import React from 'react';
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

const TrendChart = ({ data }) => {
    // Data format expected: Array of raw rows from useDashboardData
    // We need to transform this into:
    // [ { month: 'Jan', 2023: 12000, 2024: 15000, 2025: 18000 }, ... ]

    if (!data || data.length === 0) return <div className="p-8 text-center text-slate-400">No historical data available.</div>;

    const transformData = () => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const years = new Set();
        const monthlyData = {};

        // Initialize months
        monthNames.forEach(m => monthlyData[m] = { name: m });

        data.forEach(row => {
            const date = row._parsedDate;
            if (!date || isNaN(date.getTime())) return;

            const year = date.getFullYear();
            const month = monthNames[date.getMonth()];
            years.add(year);

            if (!monthlyData[month][year]) monthlyData[month][year] = 0;
            monthlyData[month][year] += (row.curOrderTotals || 0);
        });

        // Current Year check to exclude future months if needed (optional)
        // For now, return all months
        return {
            chartData: Object.values(monthlyData),
            years: Array.from(years).sort((a, b) => a - b),
            latestYear: Math.max(...Array.from(years))
        };
    };

    const { chartData, years, latestYear } = transformData();
    const colors = ['#cbd5e1', '#94a3b8', '#64748b', '#3b82f6', '#8b5cf6']; // Grays for old years, Blue/Purple for recent

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                Monthly Performance Trends
                <span className="text-xs font-normal text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                    Year over Year
                </span>
            </h3>

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
                    {years.map((year, index) => {
                        const isCurrent = year === latestYear;
                        // Use explicit color for latest year (Blue), others fade to gray
                        const color = isCurrent ? '#3b82f6' : colors[index % (colors.length - 1)];

                        return (
                            <Line
                                key={year}
                                type="monotone"
                                dataKey={year}
                                stroke={color}
                                strokeWidth={isCurrent ? 3 : 2}
                                dot={isCurrent ? { r: 4, fill: color, strokeWidth: 2, stroke: '#fff' } : false}
                                activeDot={{ r: 6 }}
                                connectNulls
                            />
                        );
                    })}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TrendChart;
