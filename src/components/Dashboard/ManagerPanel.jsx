import React from 'react';
import { Users, Eye, EyeOff, CalendarDays, Percent, Save, RefreshCw, DollarSign, Target, Settings, User, Shield, Undo2, Redo2 } from 'lucide-react';
import { AdminInput } from './Common';
import AdminPanel from './AdminPanel';
import { getBranchId } from '../../utils/formatters';

const ManagerPanel = ({
    selectedLocation,
    data,
    visibleRepIds,
    toggleRepVisibility,
    adminSettings,
    setAdminSettings,
    saveStatus,
    calculateElapsedWorkDays,
    user,
    userRole,
    monthNames,
    selectedDate,
    processedData,
    branchSummary,
    setViewMode,
    handleLocationGoalChange,
    handleLocationMonthPctChange,
    handleFormulaChange,
    handleTriggerAppsScript,
    triggerStatus,
    setSelectedLocation: setHeaderLocation,
    canUndo,
    canRedo,
    undoSettings,
    redoSettings,
    saveBranchSettings,
    saveRepSettings,
    saveGlobalConfig,
    saveHolidays,
    saveAllBranchSettings,
    newHoliday,
    setNewHoliday,
    handleAddHoliday,
    handleDeleteHoliday
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
    // Use the stored department from the user profile, not the selected header location
    const isRestrictedManager = userRole === 'manager';
    const userBranch = user.department || user.Department; // Support varied case from different sync points
    const showSettingsContent = !isRestrictedManager || userBranch === selectedLocation;

    // Deduplicate reps and filter by recent activity
    const uniqueReps = React.useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const targetDate = new Date(year, month - 1);
        const lookbackDate = new Date(year, month - 4);

        const unique = [];
        const seen = new Set();

        data.forEach(r => {
            if (!r.strSalesperson || r.strDepartment !== selectedLocation) return;
            // Filter out placeholders (where ID matches branch name)
            if (r.strSalesperson.toUpperCase() === r.strDepartment.toUpperCase()) return;

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

    const handleRepSettingChange = (repId, branchId, field, value) => {
        setAdminSettings(prev => {
            const safeBranchId = branchId || 'KNOX';
            const currentBranchSettings = prev.repSettings?.[safeBranchId] || {};
            const currentRepSettings = currentBranchSettings[repId] || {};
            const monthKey = selectedMonth;
            const existingMonths = currentRepSettings.months || {};
            const currentMonthSettings = existingMonths[monthKey] || {};

            let newRepObject = { ...currentRepSettings };

            if (field === 'targetPct') {
                // Update Base Setting
                newRepObject[field] = value;
                // If an override also exists for this month, we should probably clear it so the base setting isn't masked
                // But for now, let's just assume we update base. The UI prefers monthSet ?? repSet.
                // If monthSet.targetPct exists, base update won't show.
                // Let's clear the override for this month to be safe/consistent with user intent.
                if (newRepObject.months?.[monthKey]?.targetPct !== undefined) {
                    newRepObject.months = {
                        ...existingMonths,
                        [monthKey]: {
                            ...currentMonthSettings,
                            targetPct: undefined
                        }
                    };
                }
            } else {
                // Update Month Override (daysWorked, etc)
                newRepObject.months = {
                    ...existingMonths,
                    [monthKey]: {
                        ...currentMonthSettings,
                        [field]: value
                    }
                };
            }

            return {
                ...prev,
                repSettings: {
                    ...prev.repSettings,
                    [safeBranchId]: {
                        ...currentBranchSettings,
                        [repId]: newRepObject
                    }
                }
            };
        });
    };

    const handleLocationMonthGoalChange = (loc, field, value) => {
        setAdminSettings(prev => {
            const currentLoc = prev.locationGoals?.[loc] || {};
            const monthKey = selectedMonth;
            const existingMonths = currentLoc.months || {};
            const currentMonthSettings = existingMonths[monthKey] || {};

            return {
                ...prev,
                locationGoals: {
                    ...prev.locationGoals,
                    [loc]: {
                        ...currentLoc,
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
                    <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200 dark:border-slate-800">
                        {/* Undo/Redo Buttons */}
                        <button
                            onClick={undoSettings}
                            disabled={!canUndo}
                            title="Undo"
                            className={`p-2 rounded-lg transition-all ${canUndo ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={redoSettings}
                            disabled={!canRedo}
                            title="Redo"
                            className={`p-2 rounded-lg transition-all ${canRedo ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => saveBranchSettings(selectedLocation)}
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
                            handleLocationGoalChange={handleLocationGoalChange}
                            handleLocationMonthPctChange={handleLocationMonthPctChange}
                            handleFormulaChange={handleFormulaChange}
                            handleTriggerAppsScript={handleTriggerAppsScript}
                            triggerStatus={triggerStatus}
                            saveStatus={saveStatus}
                            processedData={processedData}
                            setSelectedLocation={setHeaderLocation}
                            saveGlobalConfig={saveGlobalConfig}
                            saveHolidays={saveHolidays}
                            saveAllBranchSettings={saveAllBranchSettings}
                            newHoliday={newHoliday}
                            setNewHoliday={setNewHoliday}
                            handleAddHoliday={handleAddHoliday}
                            handleDeleteHoliday={handleDeleteHoliday}
                        />
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                        {!showSettingsContent ? (
                            <div className="p-12 text-center">
                                <Shield className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-400">Restricted Access</h3>
                                <p className="text-sm text-slate-500 mt-2">Managers can only manage settings for their assigned location ({userBranch}).</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">Rep Settings</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Month:</label>
                                                        <input
                                                            type="month"
                                                            value={selectedMonth}
                                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                                            className="text-[10px] bg-transparent border-none p-0 font-bold text-blue-600 dark:text-blue-400 focus:ring-0 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => saveBranchSettings(selectedLocation)}
                                                disabled={saveStatus?.loading}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${saveStatus?.loading ? 'bg-slate-700 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'
                                                    }`}
                                            >
                                                {saveStatus?.loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                Save All
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {uniqueReps.map(rep => {
                                                const bid = rep.strDepartmentID || getBranchId(selectedLocation);
                                                const repSet = adminSettings.repSettings?.[bid]?.[rep.strSalesperson] || {};
                                                const monthSet = repSet.months?.[selectedMonth] || {};
                                                const targetPct = monthSet.targetPct ?? repSet.targetPct ?? '';

                                                return (
                                                    <div key={rep.strSalesperson} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => toggleRepVisibility(rep.strSalesperson)}
                                                                className={`p-2 rounded-lg transition-colors ${visibleRepIds.has(rep.strSalesperson) ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-300 bg-slate-50 dark:bg-slate-900'}`}
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
                                                                    value={monthSet.daysWorked ?? repSet.daysWorked ?? adminSettings.daysWorked ?? ''}
                                                                    onChange={(e) => handleRepSettingChange(rep.strSalesperson, bid, 'daysWorked', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <label className="text-[8px] font-black text-slate-400 uppercase mb-1">Target %</label>
                                                                <input
                                                                    type="number"
                                                                    className="w-12 text-center text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                                                    value={targetPct}
                                                                    onChange={(e) => handleRepSettingChange(rep.strSalesperson, bid, 'targetPct', e.target.value)}
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => saveRepSettings(rep.strSalesperson, bid)}
                                                                className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                                                                title="Individual Save"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                </div>
                                                <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">Branch Ratios</h3>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <AdminInput
                                                    label="Profit Goal"
                                                    value={adminSettings.locationGoals[selectedLocation]?.profitGoal || ''}
                                                    onChange={(val) => handleLocationGoalChange(selectedLocation, 'profitGoal', val)}
                                                    prefix="%"
                                                />
                                                <AdminInput
                                                    label="Close $ Goal"
                                                    value={adminSettings.locationGoals[selectedLocation]?.closeRateDollar || ''}
                                                    onChange={(val) => handleLocationGoalChange(selectedLocation, 'closeRateDollar', val)}
                                                    prefix="%"
                                                />
                                                <AdminInput
                                                    label="Close Qty Goal"
                                                    value={adminSettings.locationGoals[selectedLocation]?.closeRateQty || ''}
                                                    onChange={(val) => handleLocationGoalChange(selectedLocation, 'closeRateQty', val)}
                                                    prefix="%"
                                                />
                                            </div>

                                        </div>
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
