import React from 'react';
import { Users, Eye, EyeOff, CalendarDays, Percent } from 'lucide-react';
import { AdminInput } from './Common';

const ManagerPanel = ({
    selectedLocation,
    data,
    visibleRepIds,
    toggleRepVisibility,
    adminSettings,
    setAdminSettings
}) => {
    const filteredData = data.filter(r => r.strDepartment === selectedLocation);

    const handleRepSettingChange = (repId, field, value) => {
        setAdminSettings(prev => ({
            ...prev,
            repSettings: {
                ...prev.repSettings,
                [repId]: {
                    ...(prev.repSettings[repId] || { targetPct: 10, daysWorked: adminSettings.daysWorked }),
                    [field]: value
                }
            }
        }));
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-800 p-6 mb-8 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-blue-600 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 italic">Manager Settings: {selectedLocation} Branch</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Global Branch Settings</h3>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Total Recorded Work Days:</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    className="w-20 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-right"
                                    value={adminSettings.daysWorked}
                                    onChange={(e) => setAdminSettings(prev => ({ ...prev, daysWorked: e.target.value }))}
                                />
                                <span className="text-xs text-slate-400">days</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic font-medium">Note: Changing this affects the "To Date" goals for all reps in this location unless overridden below.</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Sales Rep Management</h3>
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                        {filteredData.map(rep => (
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
                                            value={adminSettings.repSettings?.[rep.strSalesperson]?.daysWorked ?? adminSettings.daysWorked}
                                            onChange={(e) => handleRepSettingChange(rep.strSalesperson, 'daysWorked', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Percent className="w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="number"
                                            className="w-14 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-100 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-right"
                                            value={adminSettings.repSettings?.[rep.strSalesperson]?.targetPct || 0}
                                            onChange={(e) => handleRepSettingChange(rep.strSalesperson, 'targetPct', e.target.value)}
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
