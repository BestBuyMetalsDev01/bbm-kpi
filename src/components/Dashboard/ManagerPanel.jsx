import React from 'react';
import { Users, Eye, EyeOff, CalendarDays, Percent, Save, RefreshCw, DollarSign, Target, Settings, User, Shield } from 'lucide-react';
import { AdminInput } from './Common';
import AdminPanel from './AdminPanel';

const ManagerPanel = ({
    selectedLocation,
    data,
    visibleRepIds,
    toggleRepVisibility,
    adminSettings,
    setAdminSettings,
    saveSettingsToCloud,
    saveStatus,
    calculateElapsedWorkDays,
    user,
    userRole,
    monthNames,
    selectedDate,
    processedData,
    branchSummary,
    fullHistory,
    setViewMode,
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
    setSelectedLocation: setHeaderLocation
}) => {
    const [activeTab, setActiveTab] = React.useState('manager'); // 'manager' or 'admin'
    const [selectedMonth, setSelectedMonth] = React.useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Default to 'admin' if role is admin but manager restricted
    React.useEffect(() => {
        if (userRole === 'admin' && activeTab === 'rep') {
            setActiveTab('admin');
        } else if (userRole === 'admin' && activeTab === 'manager' && !showSettingsContent) {
            setActiveTab('admin');
        }
    }, [userRole]);

    // Permission check: Managers only edit their own store
    const isRestrictedManager = userRole === 'manager';
    const showSettingsContent = !isRestrictedManager || user.Department === selectedLocation;

    // Deduplicate reps and filter by recent activity
    const uniqueReps = React.useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const targetDate = new Date(year, month - 1);
        const lookbackDate = new Date(year, month - 4);

        const unique = [];
        const seen = new Set();

        data.forEach(r => {
            if (!r.strSalesperson || r.strDepartment !== selectedLocation) return;
            const rowDate = r._parsedDate || new Date(r.date);

            if (rowDate >= lookbackDate && rowDate <= new Date(year, month, 0)) {
                if (!seen.has(r.strSalesperson)) {
                    seen.add(r.strSalesperson);
                    unique.push(r);
                }
            }
        });

        const allRepsMap = new Map();
        data.forEach(r => {
            if (r.strSalesperson && r.strDepartment === selectedLocation) allRepsMap.set(r.strSalesperson, r);
        });

        const repSettings = adminSettings.repSettings || {};
        const prevMonthKey = `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, '0')}`;

        Object.keys(repSettings).forEach(repId => {
            if (seen.has(repId)) return;
            const monthSettings = repSettings[repId]?.months?.[selectedMonth];
            const prevSettings = repSettings[repId]?.months?.[prevMonthKey];

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
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-4 duration-500 mb-8">
            {/* Header / Tabs */}
            <div className="bg-slate-50 dark:bg-slate-950 px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-900 p-1 rounded-xl">
                    {(userRole === 'manager' || userRole === 'admin' || userRole === 'executive') && (
                        <button
                            onClick={() => setActiveTab('manager')}
                            className={`px-6 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'manager' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <Settings className="w-4 h-4" /> Branch Settings
                        </button>
                    )}
                    {userRole === 'admin' && (
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`px-6 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'admin' ? 'bg-white dark:bg-slate-800 text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <Shield className="w-4 h-4" /> System Admin
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Context: <span className="text-slate-600 dark:text-slate-300">{selectedLocation}</span>
                    </span>
                    <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200 dark:border-slate-800">
                        <button
                            onClick={saveSettingsToCloud}
                            disabled={saveStatus?.loading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-xs ${saveStatus?.loading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' :
                                saveStatus?.success ? 'bg-green-600 text-white' :
                                    'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20'
                                }`}
                        >
                            {saveStatus?.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {saveStatus?.loading ? 'Saving...' : saveStatus?.success ? 'Saved!' : 'Save Branch'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {activeTab === 'admin' ? (
                    <div className="animate-in fade-in duration-300">
                        <AdminPanel
                            adminSettings={adminSettings}
                            setAdminSettings={setAdminSettings}
                            setViewMode={setViewMode}
                            monthNames={monthNames}
                            newHoliday={newHoliday}
                            setNewHoliday={setNewHoliday}
                            handleAddHoliday={handleAddHoliday}
                            handleDeleteHoliday={handleDeleteHoliday}
                            handleLocationGoalChange={handleLocationGoalChange}
                            handleLocationMonthPctChange={handleLocationMonthPctChange}
                            handleFormulaChange={handleFormulaChange}
                            handleSyncData={handleSyncData}
                            sqlSyncStatus={sqlSyncStatus}
                            handleTriggerAppsScript={handleTriggerAppsScript}
                            triggerStatus={triggerStatus}
                            saveSettingsToCloud={saveSettingsToCloud}
                            saveStatus={saveStatus}
                            processedData={processedData}
                            setSelectedLocation={setHeaderLocation}
                        />
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                        {!showSettingsContent ? (
                            <div className="p-12 text-center">
                                <Shield className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-400">Restricted Access</h3>
                                <p className="text-sm text-slate-500 mt-2">Managers can only manage settings for their assigned location ({user.Department}).</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                <div className="space-y-10">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-purple-500" /> Automation Status
                                        </h3>
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                            <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                                                Active Work Days: <span className="font-black underline">{calculateElapsedWorkDays} Days Elapsed</span>
                                            </p>
                                            <p className="text-xs text-blue-600/70 dark:text-blue-500/70 mt-2 italic">
                                                To override this, please contact a System Administrator.
                                            </p>
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
                                                    className="text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2 py-1 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {uniqueReps.map(rep => (
                                                <div key={rep.strSalesperson} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-blue-200 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => toggleRepVisibility(rep.strSalesperson)}
                                                            className={`p-2 rounded-xl transition-all ${visibleRepIds.has(rep.strSalesperson) ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                                                        >
                                                            {visibleRepIds.has(rep.strSalesperson) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                        </button>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-700 dark:text-slate-200">{rep.strName}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase">{rep.strSalesperson}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col items-end">
                                                            <label className="text-[8px] font-black text-slate-400 uppercase mb-1">Days</label>
                                                            <input
                                                                type="number"
                                                                className="w-12 text-center text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                                                value={adminSettings.repSettings?.[rep.strSalesperson]?.months?.[selectedMonth]?.daysWorked ?? adminSettings.repSettings?.[rep.strSalesperson]?.daysWorked ?? adminSettings.daysWorked ?? ''}
                                                                onChange={(e) => handleRepSettingChange(rep.strSalesperson, 'daysWorked', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <label className="text-[8px] font-black text-slate-400 uppercase mb-1">Target %</label>
                                                            <input
                                                                type="number"
                                                                className="w-12 text-center text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                                                value={adminSettings.repSettings?.[rep.strSalesperson]?.months?.[selectedMonth]?.targetPct ?? adminSettings.repSettings?.[rep.strSalesperson]?.targetPct ?? 0}
                                                                onChange={(e) => handleRepSettingChange(rep.strSalesperson, 'targetPct', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <label className="text-[8px] font-black text-slate-400 uppercase mb-1">Goal $</label>
                                                            <input
                                                                type="number"
                                                                className="w-20 text-right text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg py-1 px-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                                value={adminSettings.repSettings?.[rep.strSalesperson]?.months?.[selectedMonth]?.personalGoal ?? adminSettings.repSettings?.[rep.strSalesperson]?.personalGoal ?? 0}
                                                                onChange={(e) => handleRepSettingChange(rep.strSalesperson, 'personalGoal', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-8 p-8 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Settings className="w-4 h-4 text-blue-500" /> Branch Parameters
                                    </h3>
                                    <div className="space-y-6">
                                        <AdminInput
                                            label="Estimated Monthly Sales Goal"
                                            value={adminSettings.locationGoals[selectedLocation]?.est || ''}
                                            onChange={(val) => setAdminSettings(prev => ({
                                                ...prev,
                                                locationGoals: {
                                                    ...prev.locationGoals,
                                                    [selectedLocation]: { ...prev.locationGoals[selectedLocation], est: val }
                                                }
                                            }))}
                                            prefix="$"
                                        />
                                        <AdminInput
                                            label="Estimated Monthly Quote Goal"
                                            value={adminSettings.locationGoals[selectedLocation]?.estQty || ''}
                                            onChange={(val) => setAdminSettings(prev => ({
                                                ...prev,
                                                locationGoals: {
                                                    ...prev.locationGoals,
                                                    [selectedLocation]: { ...prev.locationGoals[selectedLocation], estQty: val }
                                                }
                                            }))}
                                            type="number"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagerPanel;
