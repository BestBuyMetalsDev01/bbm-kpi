import React, { useState } from 'react';
import { PieChart } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import Header from './Dashboard/Header';
import SummaryCards from './Dashboard/SummaryCards';
import MainTable from './Dashboard/MainTable';
import ManagerPanel from './Dashboard/ManagerPanel';
import AdminPanel from './Dashboard/AdminPanel';
import IndividualPanel from './Dashboard/IndividualPanel';
import { useAuth } from '../context/AuthContext';
import { useWeather } from '../hooks/useWeather';
import SnowEffect from './SnowEffect';
import ChristmasLights from './ChristmasLights';
import Fireworks from './Fireworks';
import LocationComparisonTable from './Dashboard/LocationComparisonTable';
import LocationTrendChart from './Dashboard/LocationTrendChart';
import TrendChart from './Dashboard/TrendChart';

const ReportDashboard = ({ initialViewMode }) => {
  const { user } = useAuth();
  const {
    data, loading, sortConfig, viewMode, setViewMode, selectedLocation, setSelectedLocation,
    showManagerSettings, setShowManagerSettings, visibleRepIds, setVisibleRepIds,
    refreshTrigger, setRefreshTrigger, darkMode, setDarkMode, adminSettings, setAdminSettings,
    processedData, branchSummary, toggleAdminMode, monthNames, handleSort,
    handleLocationGoalChange, handleLocationMonthPctChange, handleFormulaChange, toggleRepVisibility,
    handleTriggerAppsScript, triggerStatus, saveSettingsToCloud, saveStatus,
    selectedDate, setSelectedDate, dateMode, setDateMode, calculateTotalWorkDays, calculateElapsedWorkDays
  } = useDashboardData(initialViewMode);

  // Weather Effect
  const weather = useWeather(selectedLocation);

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
    { key: 'intOrders', label: 'Order Qty', type: 'number', tooltip: adminSettings.formulas.orderQty },
    { key: 'curQuoted', label: 'Estimates', type: 'currency', tooltip: adminSettings.formulas.estDollars },
    { key: 'curSubTotal', label: 'Invoice $', type: 'currency', tooltip: adminSettings.formulas.invoiceDollars },
    { key: 'performanceRates', label: 'Rates', type: 'percent', tooltip: 'Performance Rates: Profit %, $ Conversion, and Qty Conversion' },
  ];

  return (
    <>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-slate-950' : 'bg-slate-50'} relative`}>
        <ChristmasLights />
        {weather.isSnowing && <SnowEffect />}
        {isGoalReached && <Fireworks />}

        <div className="relative z-10 p-2 sm:p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto space-y-6 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">

          <Header
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            locationKeys={locationKeys}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            setRefreshTrigger={setRefreshTrigger}
            viewMode={viewMode}
            setViewMode={setViewMode}
            toggleAdminMode={toggleAdminMode}
            setShowManagerSettings={setShowManagerSettings}
            showManagerSettings={showManagerSettings}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            dateMode={dateMode}
            setDateMode={setDateMode}
          />

          {viewMode === 'admin' ? (
            <AdminPanel
              adminSettings={adminSettings}
              setAdminSettings={setAdminSettings}
              processedData={processedData}
              setViewMode={setViewMode}
              setSelectedLocation={setSelectedLocation}
              monthNames={monthNames}
              newHoliday={newHoliday}
              setNewHoliday={setNewHoliday}
              handleAddHoliday={handleAddHoliday}
              handleDeleteHoliday={handleDeleteHoliday}
              handleLocationGoalChange={handleLocationGoalChange}
              handleLocationMonthPctChange={handleLocationMonthPctChange}
              handleFormulaChange={handleFormulaChange}
              handleTriggerAppsScript={handleTriggerAppsScript}
              triggerStatus={triggerStatus}
              saveSettingsToCloud={saveSettingsToCloud}
              saveStatus={saveStatus}
            />

          ) : viewMode === 'rep' ? (
            <IndividualPanel
              processedData={processedData}
              fullHistory={data}
              branchSummary={branchSummary}
              user={user}
              monthName={monthNames[selectedDate.getMonth()]}
              adminSettings={adminSettings}
              selectedDate={selectedDate}
            />
          ) : (
            <>
              {showManagerSettings && (
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
                />
              )}

              <SummaryCards branchSummary={branchSummary} dateMode={dateMode} selectedLocation={selectedLocation} />

              {selectedLocation === 'All' && (
                <div className="space-y-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* TOP TOGGLE */}
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-blue-500" />
                        Company-Wide Comparison
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Performance breakdown for {dateMode === 'monthly' ? selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : `${selectedDate.getFullYear()} Year to Date`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* LEFT SIDE: STACKED GRAPHS */}
                    <div className="xl:col-span-5 space-y-8">
                      <TrendChart data={data} />
                      <LocationTrendChart data={data} selectedDate={selectedDate} />
                    </div>

                    {/* RIGHT SIDE: TABLE DATA */}
                    <div className="xl:col-span-7">
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
                    </div>
                  </div>
                </div>
              )}

              {selectedLocation !== 'All' && (
                <MainTable
                  processedData={processedData}
                  loading={loading}
                  sortConfig={sortConfig}
                  handleSort={handleSort}
                  columns={columns}
                  adminSettings={adminSettings}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ReportDashboard;
