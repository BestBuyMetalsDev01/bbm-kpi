import React, { useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import Header from './Dashboard/Header';
import SummaryCards from './Dashboard/SummaryCards';
import MainTable from './Dashboard/MainTable';
import ManagerPanel from './Dashboard/ManagerPanel';
import IndividualPanel from './Dashboard/IndividualPanel';
import { useAuth } from '../context/AuthContext';
import { useWeather } from '../hooks/useWeather';
import SnowEffect from './SnowEffect';
import ChristmasLights from './ChristmasLights';
import Fireworks from './Fireworks';
import LocationComparisonTable from './Dashboard/LocationComparisonTable';
import LocationTrendChart from './Dashboard/LocationTrendChart';
import TrendChart from './Dashboard/TrendChart';
import RepDetailModal from './Dashboard/RepDetailModal';
import ExecutiveDashboard from './Dashboard/ExecutiveDashboard';
import Leaderboard from './Dashboard/Leaderboard';
import CompanyMultiYearChart from './Dashboard/CompanyMultiYearChart';

const ReportDashboard = ({ initialViewMode }) => {
    const { user } = useAuth();
    const {
        data, loading, sortConfig, viewMode, setViewMode, userRole, selectedLocation, setSelectedLocation,
        showManagerSettings, setShowManagerSettings, visibleRepIds, setVisibleRepIds,
        refreshTrigger, setRefreshTrigger, darkMode, setDarkMode, adminSettings, setAdminSettings,
        processedData, visibleData, companyProcessedData, branchSummary, toggleAdminMode, monthNames, handleSort,
        handleLocationGoalChange, handleLocationMonthPctChange, handleFormulaChange, toggleRepVisibility,
        handleTriggerAppsScript, triggerStatus, saveSettingsToCloud, saveStatus,
        productsData,
        selectedDate, setSelectedDate, dateMode, setDateMode, calculateTotalWorkDays, calculateElapsedWorkDays
    } = useDashboardData(initialViewMode);

    // Weather Effect
    const weather = useWeather(selectedLocation);

    // Selected Rep for Modal
    const [selectedRep, setSelectedRep] = useState(null);

    // Check for Celebration (User met monthly goal)
    const isGoalReached = React.useMemo(() => {
        if (!user || !processedData) return false;
        const myRow = processedData.find(r => r.strSalesperson === user.employeeId);
        if (myRow && myRow.totalSalesGoal > 0 && myRow.curOrderTotals >= myRow.totalSalesGoal) {
            return true;
        }
        return false;
    }, [user, processedData]);

    const [newHoliday, setNewHoliday] = useState({ name: '', date: '' });

    const handleAddHoliday = () => {
        if (newHoliday.name && newHoliday.date) {
            setAdminSettings(prev => ({ ...prev, holidays: [...prev.holidays, { id: Date.now(), ...newHoliday }] }));
            setNewHoliday({ name: '', date: '' });
        }
    };

    const handleDeleteHoliday = (id) => setAdminSettings(prev => ({ ...prev, holidays: prev.holidays.filter(h => h.id !== id) }));

    const locationKeys = Object.keys(adminSettings.locationGoals);

    const columns = [
        { key: 'totalSalesGoal', label: 'Sales Goals', type: 'currency', tooltip: adminSettings.formulas.totalSalesGoal },
        { key: 'curOrderTotals', label: 'Sales Orders', type: 'currency', tooltip: adminSettings.formulas.salesOrders },
        { key: 'intOrders', label: 'Orders', type: 'number', tooltip: adminSettings.formulas.orderQty },
        { key: 'performanceRates', label: 'Performance Rates', type: 'custom', tooltip: "Profit, $ Conv, and Qty Conv" },
        { key: 'salesPace', label: 'Month Pace', type: 'currency', tooltip: adminSettings.formulas.monthPace },
        { key: 'paceToGoal', label: 'Pace vs Goal', type: 'percent', colored: true, tooltip: adminSettings.formulas.paceVsGoal },
        { key: 'curSubTotal', label: 'Invoiced Totals', type: 'currency', tooltip: adminSettings.formulas.invoiceDollars }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans antialiased overflow-x-hidden relative`}>
            <SnowEffect weather={weather} />
            <ChristmasLights weather={weather} />
            {isGoalReached && <Fireworks />}

            <div className="relative z-20">
                <div className="max-w-[1600px] mx-auto pt-12 pb-6 px-4 sm:px-6 lg:px-8">
                    <Header
                        selectedLocation={selectedLocation}
                        setSelectedLocation={setSelectedLocation}
                        locationKeys={locationKeys}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        dateMode={dateMode}
                        setDateMode={setDateMode}
                        darkMode={darkMode}
                        setDarkMode={setDarkMode}
                        setRefreshTrigger={setRefreshTrigger}
                        user={user}
                        userRole={userRole}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        showManagerSettings={showManagerSettings}
                        setShowManagerSettings={setShowManagerSettings}
                    />
                </div>

                <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
                    {showManagerSettings && (
                        <div className="z-[100] relative">
                            <ManagerPanel
                                selectedLocation={selectedLocation}
                                data={data}
                                visibleRepIds={visibleRepIds}
                                toggleRepVisibility={toggleRepVisibility}
                                adminSettings={adminSettings}
                                setAdminSettings={setAdminSettings}
                                saveSettingsToCloud={saveSettingsToCloud}
                                saveStatus={saveStatus}
                                calculateElapsedWorkDays={calculateElapsedWorkDays}
                                user={user}
                                userRole={userRole}
                                monthNames={monthNames}
                                selectedDate={selectedDate}
                                processedData={processedData}
                                branchSummary={branchSummary}
                                fullHistory={data}
                                setViewMode={setViewMode}
                                newHoliday={newHoliday}
                                setNewHoliday={setNewHoliday}
                                handleAddHoliday={handleAddHoliday}
                                handleDeleteHoliday={handleDeleteHoliday}
                                handleLocationGoalChange={handleLocationGoalChange}
                                handleLocationMonthPctChange={handleLocationMonthPctChange}
                                handleFormulaChange={handleFormulaChange}
                                handleTriggerAppsScript={handleTriggerAppsScript}
                                triggerStatus={triggerStatus}
                                setSelectedLocation={setSelectedLocation}
                            />
                        </div>
                    )}

                    {viewMode === 'rep' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <IndividualPanel
                                processedData={processedData}
                                fullHistory={data}
                                branchSummary={branchSummary}
                                user={user}
                                monthName={monthNames[selectedDate.getMonth()]}
                                adminSettings={adminSettings}
                                selectedDate={selectedDate}
                            />
                        </div>
                    ) : viewMode === 'comparison' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <SummaryCards branchSummary={branchSummary} dateMode={dateMode} selectedLocation="All" />
                            <LocationComparisonTable
                                data={data}
                                adminSettings={adminSettings}
                                locationKeys={locationKeys}
                                selectedDate={selectedDate}
                                calculateTotalWorkDays={calculateTotalWorkDays}
                                calculateElapsedWorkDays={calculateElapsedWorkDays}
                                dateMode={dateMode}
                                setDateMode={setDateMode}
                            />
                            <LocationTrendChart data={data} selectedDate={selectedDate} />
                            <CompanyMultiYearChart data={data} />
                        </div>
                    ) : viewMode === 'executive' ? (
                        <ExecutiveDashboard
                            data={data}
                            processedData={processedData}
                            onRepClick={(rep) => setSelectedRep(rep)}
                        />
                    ) : viewMode === 'leaderboard' ? (
                        <Leaderboard
                            processedData={companyProcessedData}
                            productsData={productsData}
                        />
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <SummaryCards branchSummary={branchSummary} dateMode={dateMode} selectedLocation={selectedLocation} />

                            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <MainTable
                                    processedData={visibleData}
                                    columns={columns}
                                    handleSort={handleSort}
                                    sortConfig={sortConfig}
                                    adminSettings={adminSettings}
                                    selectedLocation={selectedLocation}
                                    loading={loading}
                                    onRepClick={(rep) => setSelectedRep(rep)}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <TrendChart data={data} location={selectedLocation} />
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Rep Detail Modal */}
            <RepDetailModal
                isOpen={!!selectedRep}
                onClose={() => setSelectedRep(null)}
                repData={selectedRep}
                fullHistory={data}
                adminSettings={adminSettings}
                selectedDate={selectedDate}
                monthName={monthNames[selectedDate.getMonth()]}
            />

            {triggerStatus?.loading && (
                <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-right-8 duration-500">
                    <div className="bg-slate-900 border border-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-widest">Cloud Update</p>
                            <p className="text-[10px] text-slate-400 font-bold">Syncing global metrics...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportDashboard;
