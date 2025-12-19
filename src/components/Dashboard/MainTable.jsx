import React from 'react';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

const SortableHeader = ({ label, sortKey, currentSort, onSort, align = "left", sticky, title }) => {
    return (
        <th
            title={title}
            onClick={() => onSort(sortKey)}
            className={`p-1.5 cursor-pointer select-none transition-colors border-r border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800/80 ${sticky ? 'sticky left-0 bg-slate-50 dark:bg-slate-800 z-10' : ''} ${align === 'right' ? 'text-right' : 'text-left'}`}
        >
            <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {label}
            </div>
        </th>
    );
};

const MainTable = ({ processedData, loading, sortConfig, handleSort, columns, adminSettings }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto pb-4">
                <table className="w-full text-left border-collapse" style={{ minWidth: '1000px' }}>
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                            <SortableHeader label="Salesperson" sortKey="strName" currentSort={sortConfig} onSort={handleSort} sticky />
                            {columns.map(col => (
                                <SortableHeader
                                    key={col.key}
                                    label={col.label}
                                    sortKey={col.key}
                                    currentSort={sortConfig}
                                    onSort={handleSort}
                                    align="right"
                                    title={col.tooltip}
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="24" className="p-12 text-center text-slate-500 dark:text-slate-400">Loading data...</td></tr>
                        ) : (
                            processedData.map((row, idx) => (
                                <tr key={idx} className={`group transition-colors ${row.isMisc ? 'bg-orange-50 dark:bg-orange-950/20 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                    <td className="p-1.5 sticky left-0 bg-white dark:bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-100 dark:border-slate-800 transition-colors">
                                        <div className="font-medium text-slate-900 dark:text-slate-100">{row.strName}</div>
                                        {!row.isMisc && (
                                            <div className="flex flex-col text-[10px]">
                                                <div className="text-slate-400 dark:text-slate-500 uppercase font-bold">{row.strDepartment}</div>
                                                <div className="flex items-center gap-1.5 mt-0.5 font-bold">
                                                    <span className="text-slate-500">Exp: {formatPercent(row.expContrib || 0)}</span>
                                                    <span className={row.actContrib >= row.expContrib ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                        Act: {formatPercent(row.actContrib || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    {columns.map(col => {
                                        let displayVal = row[col.key];
                                        let colorClass = "text-slate-600 dark:text-slate-300";

                                        if (col.type === 'currency') displayVal = formatCurrency(displayVal);
                                        else if (col.type === 'percent') displayVal = formatPercent(displayVal);
                                        else if (col.type === 'number') displayVal = formatNumber(displayVal);

                                        if (col.colored) {
                                            if (col.key === 'toDateVariance') colorClass = row[col.key] >= 0 ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium";
                                            if (col.key === 'curInvoiceProfit') colorClass = "text-green-700 dark:text-green-400 font-medium";
                                        }

                                        if (col.key === 'performanceRates') {
                                            const profit = row.decProfitPercent || 0;
                                            const convDollar = row.convRateDollars || 0;
                                            const convQty = row.convRateQty || 0;

                                            const locGoal = adminSettings?.locationGoals?.[row.strDepartment] || {};
                                            const profitTarget = locGoal.profitGoal || 25;
                                            const dollarTarget = locGoal.closeRateDollar || 30;
                                            const qtyTarget = locGoal.closeRateQty || 25;

                                            const getCol = (v, t) => v >= t ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

                                            return (
                                                <td key={col.key} className="p-1.5 text-right text-sm border-r border-slate-50 dark:border-slate-800 last:border-0">
                                                    <div className="flex flex-col gap-0.5 min-w-[90px]">
                                                        <div className="flex justify-between items-center gap-2">
                                                            <span className="text-[9px] text-slate-400 uppercase font-bold">Profit</span>
                                                            <span className={`font-bold ${getCol(profit, profitTarget)}`}>{formatPercent(profit)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center gap-2">
                                                            <span className="text-[9px] text-slate-400 uppercase font-bold">$ Conv</span>
                                                            <span className={`font-bold ${getCol(convDollar, dollarTarget)}`}>{formatPercent(convDollar)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center gap-2">
                                                            <span className="text-[9px] text-slate-400 uppercase font-bold">Qty Conv</span>
                                                            <span className={`font-bold ${getCol(convQty, qtyTarget)}`}>{formatPercent(convQty)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        if (col.key === 'intOrders') {
                                            const orders = row.intOrders || 0;
                                            const invoices = row.intInvoices || 0;
                                            return (
                                                <td key={col.key} className="p-1.5 text-right text-sm border-r border-slate-50 dark:border-slate-800 last:border-0">
                                                    <div className="flex flex-col items-end">
                                                        <div className="font-semibold text-slate-900 dark:text-slate-100">{formatNumber(orders)}</div>
                                                        <div className="w-full flex justify-between items-center text-[10px] gap-1.5 mt-0.5 font-bold">
                                                            <span className="text-slate-400 dark:text-slate-500 uppercase">Inv</span>
                                                            <span className="text-slate-500 dark:text-slate-400">{formatNumber(invoices)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        if (col.key === 'curQuoted') {
                                            const dollAct = row.curQuoted || 0;
                                            const dollGoal = row.toDateEstGoal || 0;
                                            const qtyAct = row.intQuotes || 0;
                                            const qtyGoal = row.toDateEstQtyGoal || 0;

                                            const dCol = dollAct >= dollGoal ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
                                            const qCol = qtyAct >= qtyGoal ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

                                            return (
                                                <td key={col.key} className="p-1.5 text-right text-xs border-r border-slate-50 dark:border-slate-800 last:border-0">
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/30 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/50 flex flex-col gap-1 min-w-[120px]">
                                                        <div className="flex justify-between items-baseline gap-1.5">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase">$</span>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-slate-900 dark:text-slate-100 font-bold">{formatCurrency(dollAct)}</span>
                                                                <span className={`text-[9px] font-bold ${dCol}`}>G: {formatCurrency(dollGoal)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-px bg-slate-100 dark:bg-slate-800" />
                                                        <div className="flex justify-between items-baseline gap-1.5">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Qty</span>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-slate-900 dark:text-slate-100 font-bold">{formatNumber(qtyAct)}</span>
                                                                <span className={`text-[9px] font-bold ${qCol}`}>G: {formatNumber(qtyGoal)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        if (col.key === 'curSubTotal') {
                                            const invoice = row.curSubTotal || 0;
                                            const profit = row.curInvoiceProfit || 0;
                                            return (
                                                <td key={col.key} className="p-1.5 text-right text-sm border-r border-slate-50 dark:border-slate-800 last:border-0">
                                                    <div className="flex flex-col items-end">
                                                        <div className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(invoice)}</div>
                                                        <div className="w-full flex justify-between items-center text-[10px] gap-2 mt-0.5 font-bold">
                                                            <span className="text-slate-400 dark:text-slate-500 uppercase">Profit</span>
                                                            <span className="text-green-600 dark:text-green-400">{formatCurrency(profit)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        if (col.key === 'totalSalesGoal') {
                                            const monthly = row.totalSalesGoal || 0;
                                            const toDate = row.toDateSalesGoal || 0;
                                            const daily = row.dailySalesGoal || 0;
                                            return (
                                                <td key={col.key} className="p-1.5 text-right text-sm border-r border-slate-50 dark:border-slate-800 last:border-0">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{formatCurrency(monthly)}</div>
                                                        <div className="w-full flex flex-col items-stretch text-[9px] font-bold border-t border-slate-100 dark:border-slate-800 pt-1 gap-0.5">
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400 dark:text-slate-500 uppercase">To Date</span>
                                                                <span className="text-slate-500 dark:text-slate-400">{formatCurrency(toDate)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400 dark:text-slate-500 uppercase">Daily</span>
                                                                <span className="text-slate-500 dark:text-slate-400">{formatCurrency(daily)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        if (col.key === 'curOrderTotals') {
                                            const actual = row.curOrderTotals || 0;
                                            const variance = row.toDateVariance || 0;
                                            const varColor = variance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
                                            return (
                                                <td key={col.key} className="p-1.5 text-right text-sm border-r border-slate-50 dark:border-slate-800 last:border-0">
                                                    <div className="flex flex-col items-end">
                                                        <div className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(actual)}</div>
                                                        <div className="w-full flex justify-between items-center text-[10px] gap-2 mt-0.5 font-bold">
                                                            <span className="text-slate-400 dark:text-slate-500 uppercase">Var</span>
                                                            <span className={varColor}>{variance >= 0 ? '+' : ''}{formatCurrency(variance)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        return (
                                            <td key={col.key} className={`p-1.5 text-right text-sm ${colorClass} border-r border-slate-50 dark:border-slate-800 last:border-0`}>
                                                {displayVal}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MainTable;
