import React from 'react';
import { Users, Eye, EyeOff, CalendarDays, Percent, Save, RefreshCw, DollarSign } from 'lucide-react';
import { AdminInput } from './Common';

const ManagerPanel = ({
    selectedLocation,
    data,
    visibleRepIds,
    toggleRepVisibility,
    adminSettings,
    setAdminSettings,
    saveSettingsToCloud,
    saveStatus,
    calculateElapsedWorkDays
}) => {
    const [selectedMonth, setSelectedMonth] = React.useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Deduplicate reps and filter by recent activity (3 months lookback)
    const uniqueReps = React.useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const targetDate = new Date(year, month - 1); // Month is 0-indexed in JS
        const lookbackDate = new Date(year, month - 4); // 3 months prior

        const unique = [];
        const seen = new Set();

        // 1. Find reps active in the window [lookbackDate, targetDate]
        data.forEach(r => {
            if (!r.strSalesperson || r.strDepartment !== selectedLocation) return;

            const rDate = r._parsedDate; // Assuming we passed the parsed data or need to re-parse if raw
            // Safety check for date. If _parsedDate missing, try parsing or skip
            const rowDate = rDate || new Date(r.date);

            if (rowDate >= lookbackDate && rowDate <= new Date(year, month, 0)) { // End of target month
                if (!seen.has(r.strSalesperson)) {
                    seen.add(r.strSalesperson);
                    unique.push(r);
                }
            }
        });

        // 2. ALSO include anyone who already has settings for this specific month (so they don't disappear)
        // Or anyone who had settings in the PREVIOUS month (to support "add on more")
        const prevMonthKey = `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, '0')}`;

        // We need a list of ALL known reps from data to lookup names if we only have IDs in settings
        // Ideally 'data' contains all we need. If a rep has settings but NO sales in history, they might be missing from 'data'.
        // For now, assume they exist in 'data' somewhere if they have settings.

        const allRepsMap = new Map();
        data.forEach(r => {
            if (r.strSalesperson && r.strDepartment === selectedLocation) allRepsMap.set(r.strSalesperson, r);
        });

        // Check settings
        const repSettings = adminSettings.repSettings || {};
        Object.keys(repSettings).forEach(repId => {
            if (seen.has(repId)) return;

            const monthSettings = repSettings[repId]?.months?.[selectedMonth];
            const prevSettings = repSettings[repId]?.months?.[prevMonthKey];

            // If they have settings for TARGET month OR PREVIOUS month, force show them
            if (monthSettings || prevSettings) {
                const repData = allRepsMap.get(repId);
                if (repData) {
                    seen.add(repId);
                    unique.push(repData);
                }
            }
        });

        return unique.sort((a, b) => a.strName.localeCompare(b.strName));
    }, [data, selectedLocation, selectedMonth, adminSettings.repSettings]);

    const handleRepSettingChange = (repId, field, value) => {
        setAdminSettings(prev => {
            const currentRepSettings = prev.repSettings?.[repId] || {};
            // If editing a "monthly" field (goal, days worked), store it in a month-keyed object
            // For backward compatibility, we'll keep the top-level keys as "current defaults" or similar?
            // Actually, the user wants to "add on more every new month".
            // Let's migrate to: repSettings[id].months[YYYY-MM] = { ... }

            // To be safe and incremental, let's treat the inputs as editing the *selectedMonth* settings.
            const monthKey = selectedMonth;
            const existingMonths = currentRepSettings.months || {};
            const currentMonthSettings = existingMonths[monthKey] || {};

            return {
                ...prev,
                repSettings: {
                    ...prev.repSettings,
                    [repId]: {
                        ...currentRepSettings,
                        months: {
                            ...existingMonths,
                            [monthKey]: {
                                ...currentMonthSettings,
                                [field]: value
                            }
                        }
                    }
                }
            };
        });
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-800 p-6 mb-8 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 italic">Manager Settings: {selectedLocation} Branch</h2>
                </div>

                <button
                    onClick={saveSettingsToCloud}
                    disabled={saveStatus?.loading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-xs shadow-md ${saveStatus?.loading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' :
                        saveStatus?.success ? 'bg-green-600 text-white shadow-green-900/20' :
                            'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20'
                        }`}
                >
                    {saveStatus?.loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    {saveStatus?.loading ? 'Saving...' : saveStatus?.success ? 'Saved!' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider italic">Automation Active</h3>
                        </div>
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                The system is currently auto-calculating work days based on the calendar and holidays.
                                <br /><br />
                                Current Progress: <span className="font-black underline">{calculateElapsedWorkDays} Days Elapsed</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sales Rep Management</h3>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Target Month:</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2 py-1 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                        {uniqueReps.map(rep => (
                            <div key={rep.strSalesperson} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <button
                                        onClick={() => toggleRepVisibility(rep.strSalesperson)}
                                        className={`p-1.5 rounded-md transition-colors ${visibleRepIds.has(rep.strSalesperson) ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                                    >
                                        {visibleRepIds.has(rep.strSalesperson) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <div className="truncate">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{rep.strName}</div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{rep.strSalesperson}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 ml-4 shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="number"
                                            className="w-14 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-100 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-right"
                                            value={adminSettings.repSettings?.[rep.strSalesperson]?.months?.[selectedMonth]?.daysWorked ?? adminSettings.repSettings?.[rep.strSalesperson]?.daysWorked ?? adminSettings.daysWorked}
                                            onChange={(e) => handleRepSettingChange(rep.strSalesperson, 'daysWorked', e.target.value)}
                                            title={`Days Worked in ${selectedMonth}`}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Percent className="w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="number"
                                            className="w-14 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-100 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-right"
                                            value={adminSettings.repSettings?.[rep.strSalesperson]?.months?.[selectedMonth]?.targetPct ?? adminSettings.repSettings?.[rep.strSalesperson]?.targetPct ?? 0}
                                            onChange={(e) => handleRepSettingChange(rep.strSalesperson, 'targetPct', e.target.value)}
                                            title="Contribution Target %"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="number"
                                            className="w-20 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-100 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-right"
                                            value={adminSettings.repSettings?.[rep.strSalesperson]?.months?.[selectedMonth]?.personalGoal ?? adminSettings.repSettings?.[rep.strSalesperson]?.personalGoal ?? 0}
                                            onChange={(e) => handleRepSettingChange(rep.strSalesperson, 'personalGoal', e.target.value)}
                                            title={`Personal Goal ($) for ${selectedMonth}`}
                                            placeholder="Goal"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerPanel;
