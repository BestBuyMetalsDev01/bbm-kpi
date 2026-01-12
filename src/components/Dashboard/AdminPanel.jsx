import React from 'react';
import { Shield, Save, ArrowLeft, Calendar, Trash2, Plus, MapPin, Percent, Target, RefreshCw, CheckCircle, AlertCircle, UserCog } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatBranchName } from '../../utils/formatters';

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
    triggerStatus,
    saveStatus,
    processedData,
    setSelectedLocation,
    saveGlobalConfig,
    saveHolidays,
    saveAllBranchSettings
}) => {
    const { user, setUser } = useAuth();
    const [showPermissionsModal, setShowPermissionsModal] = React.useState(false);

    // Deduplicate Reps for the Simulation Dropdown
    const availableReps = React.useMemo(() => {
        if (!processedData) return [];
        const map = new Map();
        processedData.forEach(row => {
            if (row.strSalesperson && row.strName) {
                if (!map.has(row.strSalesperson)) {
                    map.set(row.strSalesperson, row.strName);
                }
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [processedData]);

    const handleSimulateUser = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;

        const rep = availableReps.find(r => r.id === selectedId);
        if (rep) {
            setUser(prev => ({
                ...prev,
                name: rep.name,
                employeeId: rep.id,
                'Job Title': 'Simulated Rep',
                Department: 'Simulated Location'
            }));
        }
    };

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

                {/* User Simulation Control */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                    <UserCog className="w-4 h-4 text-purple-500" />
                    <select
                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none w-48"
                        onChange={handleSimulateUser}
                        value={user?.employeeId || ""}
                    >
                        <option value="">Select User to Test...</option>
                        {availableReps.map(rep => (
                            <option key={rep.id} value={rep.id}>
                                {rep.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={saveGlobalConfig}
                        disabled={saveStatus?.loading}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm shadow-lg ${saveStatus?.loading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' :
                            saveStatus?.success ? 'bg-green-600 text-white shadow-green-900/20' :
                                'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20'
                            }`}
                    >
                        {saveStatus?.loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saveStatus?.loading ? 'Saving...' : saveStatus?.success ? 'Saved Config' : 'Save Config'}
                    </button>
                    <button
                        onClick={() => setViewMode('manager')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Exit Admin
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                <div className="space-y-10">
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-purple-500" /> Holiday Configuration
                            </h3>
                            <button
                                onClick={saveHolidays}
                                disabled={saveStatus?.loading}
                                className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-all shadow-md"
                            >
                                {saveStatus?.loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                Save Holidays
                            </button>
                        </div>
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
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Location Sales Goals</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500">Year:</span>
                                    <select
                                        className="bg-slate-800 text-white text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={adminSettings.selectedGoalYear || new Date().getFullYear()}
                                        onChange={(e) => setAdminSettings(prev => ({ ...prev, selectedGoalYear: parseInt(e.target.value) }))}
                                    >
                                        <option value={2024}>2024</option>
                                        <option value={2025}>2025</option>
                                        <option value={2026}>2026</option>
                                    </select>
                                </div>
                                <button
                                    onClick={saveAllBranchSettings}
                                    disabled={saveStatus?.loading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md"
                                >
                                    {saveStatus?.loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save Goals
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {locationKeys.map(loc => {
                                const selectedYear = adminSettings.selectedGoalYear || new Date().getFullYear();
                                const yearlyKey = `yearlySales${selectedYear}`;
                                const currentValue = adminSettings.locationGoals[loc]?.[yearlyKey]
                                    || (selectedYear === 2024 ? adminSettings.locationGoals[loc]?.yearlySales : '')
                                    || '';

                                return (
                                    <div key={loc} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-2 mb-3">
                                            <MapPin className="w-4 h-4 text-blue-500" />
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{formatBranchName(loc)}</span>
                                        </div>
                                        <div className="space-y-4">
                                            <AdminInput
                                                label={`${selectedYear} Yearly Sales Goal`}
                                                value={currentValue}
                                                onChange={(val) => handleLocationGoalChange(loc, yearlyKey, val)}
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
                                );
                            })}
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
                                label="Data & Settings Source URL"
                                value={adminSettings.googleSheetUrl || ''}
                                onChange={(val) => setAdminSettings(prev => ({ ...prev, googleSheetUrl: val }))}
                            />
                            <AdminInput
                                label="Directory Script URL"
                                value={adminSettings.directoryScriptUrl || ''}
                                onChange={(val) => setAdminSettings(prev => ({ ...prev, directoryScriptUrl: val }))}
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

                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Month-End Work Days Override</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            placeholder="Auto"
                                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={adminSettings.daysWorked || ''}
                                            onChange={(e) => setAdminSettings(prev => ({ ...prev, daysWorked: e.target.value }))}
                                        />
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                                            Status: <span className="text-blue-500 font-bold">{adminSettings.daysWorked ? 'Override On' : 'Automatic'}</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 italic">Leave blank to use system auto-calculation based on calendar and holidays.</p>
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
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Access Control</h3>
                            <button
                                onClick={() => setShowPermissionsModal(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black tracking-widest hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all uppercase"
                            >
                                <UserCog className="w-3 h-3" /> Manage Permissions
                            </button>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                {Object.keys(adminSettings.permissions || {}).length} Custom Overrides Active
                            </p>
                            <p className="text-[10px] text-slate-400 italic">
                                Users without overrides are assigned roles based on Job Titles.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Permissions Modal */}
            {showPermissionsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white">User Permissions</h3>
                            </div>
                            <button
                                onClick={() => setShowPermissionsModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {Object.entries(adminSettings.permissions || {}).map(([email, role]) => (
                                    <div key={email} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 group hover:border-blue-200 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{email}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${role === 'admin' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                    role === 'executive' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        role === 'manager' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                                            'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                    }`}>
                                                    {role}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newPerms = { ...adminSettings.permissions };
                                                delete newPerms[email];
                                                setAdminSettings(prev => ({ ...prev, permissions: newPerms }));
                                            }}
                                            className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {Object.keys(adminSettings.permissions || {}).length === 0 && (
                                    <div className="text-center py-10">
                                        <UserCog className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                                        <p className="text-xs text-slate-400 italic">No custom overrides set.<br />System is using default Job Title mapping.</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">Add Custom Override</label>
                                <div className="flex flex-col gap-3">
                                    <input
                                        id="new-perm-email"
                                        type="email"
                                        placeholder="user@bestbuymetals.com"
                                        className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="flex gap-2">
                                        <select
                                            id="new-perm-role"
                                            className="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="rep">Rep</option>
                                            <option value="manager">Manager</option>
                                            <option value="executive">Executive</option>
                                            <option value="admin">Admin</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                        <button
                                            onClick={() => {
                                                const email = document.getElementById('new-perm-email').value;
                                                const role = document.getElementById('new-perm-role').value;
                                                if (email) {
                                                    setAdminSettings(prev => ({
                                                        ...prev,
                                                        permissions: {
                                                            ...(prev.permissions || {}),
                                                            [email.toLowerCase()]: role
                                                        }
                                                    }));
                                                    document.getElementById('new-perm-email').value = '';
                                                }
                                            }}
                                            className="px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
