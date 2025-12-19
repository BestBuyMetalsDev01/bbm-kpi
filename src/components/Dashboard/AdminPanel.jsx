import React from 'react';
import { Shield, Save, ArrowLeft, Calendar, Trash2, Plus, MapPin, Percent, Target, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

import { AdminInput } from './Common';

const AdminPanel = ({
    adminSettings,
    setAdminSettings,
    setViewMode,
    monthNames,
    newHoliday,
    setNewHoliday,
    handleAddHoliday,
    handleDeleteHoliday,
    handleLocationGoalChange,
    handleLocationMonthPctChange,
    handleFormulaChange,
    handleSyncData,
    sqlSyncStatus,
    handleTriggerAppsScript,
    triggerStatus
}) => {
    const locationKeys = Object.keys(adminSettings.locationGoals);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 mb-8 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg shadow-purple-200 dark:shadow-none">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">System Configuration</h2>
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Manage global goals, holidays, and data sources</p>
                    </div>
                </div>
                <button
                    onClick={() => setViewMode('manager')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Exit Admin
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                <div className="space-y-10">
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-500" /> Holiday Configuration
                        </h3>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto mb-4 pr-2">
                            {adminSettings.holidays.map(holiday => (
                                <div key={holiday.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-purple-200 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{holiday.name}</span>
                                        <span className="text-[10px] text-slate-400 font-semibold">{holiday.date}</span>
                                    </div>
                                    <button onClick={() => handleDeleteHoliday(holiday.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Holiday Name"
                                className="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                                value={newHoliday.name}
                                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                            />
                            <input
                                type="date"
                                className="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                                value={newHoliday.date}
                                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                            />
                            <button onClick={handleAddHoliday} className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Location Sales Goals</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {locationKeys.map(loc => (
                                <div key={loc} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-200 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="w-4 h-4 text-blue-500" />
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{loc}</span>
                                    </div>
                                    <div className="space-y-4">
                                        <AdminInput
                                            label="Yearly Sales Goal"
                                            value={adminSettings.locationGoals[loc]?.yearlySales || ''}
                                            onChange={(val) => handleLocationGoalChange(loc, 'yearlySales', val)}
                                            prefix="$"
                                        />
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Monthly Weights (%)</label>
                                            <div className="grid grid-cols-6 gap-1">
                                                {adminSettings.locationGoals[loc]?.monthlyPcts?.map((pct, idx) => (
                                                    <div key={idx} className="flex flex-col items-center">
                                                        <span className="text-[8px] font-bold text-slate-400 mb-0.5">{monthNames[idx].substring(0, 1)}</span>
                                                        <input
                                                            type="text"
                                                            className="w-full text-[10px] p-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                            value={pct}
                                                            onChange={(e) => handleLocationMonthPctChange(loc, idx, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 dark:shadow-none">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Save className="w-4 h-4 text-blue-400" /> Data Source Connection (API)
                        </h3>
                        <div className="space-y-4">
                            <AdminInput
                                label="Apps Script Web App URL"
                                value={adminSettings.googleSheetUrl || ''}
                                onChange={(val) => setAdminSettings(prev => ({ ...prev, googleSheetUrl: val }))}
                            />
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Data Update & Refresh Settings</h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Client-Side Auto-Refresh</label>
                                        <div className="flex items-center gap-2 h-10">
                                            <input
                                                type="checkbox"
                                                checked={adminSettings.autoRefreshEnabled || false}
                                                onChange={(e) => setAdminSettings(prev => ({ ...prev, autoRefreshEnabled: e.target.checked }))}
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Enable Auto-Fetch</span>
                                        </div>
                                    </div>
                                    <AdminInput
                                        label="Refresh Interval (Minutes)"
                                        value={adminSettings.refreshInterval || 10}
                                        onChange={(val) => setAdminSettings(prev => ({ ...prev, refreshInterval: parseInt(val) || 10 }))}
                                        type="number"
                                    />
                                </div>

                                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                                    <p className="font-bold mb-1">ℹ️ Recommended Architecture:</p>
                                    <ul className="list-disc list-inside space-y-1 opacity-90">
                                        <li><strong>Server-Side:</strong> Set up a "Time-Driven Trigger" in your Google Apps Script project (e.g., every 10 mins) to update the data automatically.</li>
                                        <li><strong>Client-Side:</strong> Enable "Auto-Fetch" above to make this dashboard automatically pull that new data without you clicking refresh.</li>
                                    </ul>
                                </div>

                                <button
                                    onClick={handleTriggerAppsScript}
                                    disabled={triggerStatus?.loading}
                                    className={`w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-sm shadow-lg ${triggerStatus?.loading
                                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                        : triggerStatus?.success
                                            ? 'bg-green-600 text-white shadow-green-900/20'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/20'
                                        }`}
                                >
                                    {triggerStatus?.loading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" /> Triggering Update...
                                        </>
                                    ) : triggerStatus?.success ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" /> Trigger Complete!
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" /> Trigger Data Update
                                        </>
                                    )}
                                </button>
                                {triggerStatus?.error && (
                                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-400 text-xs animate-in slide-in-from-top-1">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{triggerStatus.error}</span>
                                    </div>
                                )}
                            </div>


                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Performance Ratios Configuration</h3>
                        </div>
                        <div className="overflow-x-auto bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold uppercase text-xs">
                                    <tr>
                                        <th className="p-3">Branch Location</th>
                                        <th className="p-3">Goal Profit %</th>
                                        <th className="p-3">Goal $ Close Rate %</th>
                                        <th className="p-3">Goal Qty Close Rate %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {locationKeys.map(loc => {
                                        const goal = adminSettings.locationGoals[loc] || {};
                                        return (
                                            <tr key={loc} className="bg-white dark:bg-slate-900">
                                                <td className="p-3 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-purple-400" /> {loc}
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <Percent className="w-4 h-4 text-green-500" />
                                                        <input type="number" className="w-24 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded p-1.5 focus:ring-2 focus:ring-purple-500 outline-none"
                                                            value={goal.profitGoal || ''} placeholder="25"
                                                            onChange={(e) => handleLocationGoalChange(loc, 'profitGoal', e.target.value)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <Target className="w-4 h-4 text-blue-500" />
                                                        <input type="number" className="w-24 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded p-1.5 focus:ring-2 focus:ring-purple-500 outline-none"
                                                            value={goal.closeRateDollar || ''} placeholder="30"
                                                            onChange={(e) => handleLocationGoalChange(loc, 'closeRateDollar', e.target.value)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <Target className="w-4 h-4 text-orange-500" />
                                                        <input type="number" className="w-24 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded p-1.5 focus:ring-2 focus:ring-purple-500 outline-none"
                                                            value={goal.closeRateQty || ''} placeholder="25"
                                                            onChange={(e) => handleLocationGoalChange(loc, 'closeRateQty', e.target.value)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Field Formulas / Tooltips</h3>
                        <div className="bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-4 h-64 overflow-y-auto space-y-3">
                            {Object.entries(adminSettings.formulas).map(([key, formula]) => (
                                <div key={key}>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={formula}
                                        onChange={(e) => handleFormulaChange(key, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
