import React, { useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import Header from './Dashboard/Header';
import SummaryCards from './Dashboard/SummaryCards';
import MainTable from './Dashboard/MainTable';
import ManagerPanel from './Dashboard/ManagerPanel';
import AdminPanel from './Dashboard/AdminPanel';

const ReportDashboard = ({ initialViewMode }) => {
  const {
    data, loading, sortConfig, viewMode, setViewMode, selectedLocation, setSelectedLocation,
    showManagerSettings, setShowManagerSettings, visibleRepIds, setVisibleRepIds,
    refreshTrigger, setRefreshTrigger, darkMode, setDarkMode, adminSettings, setAdminSettings,
    processedData, branchSummary, toggleAdminMode, monthNames, handleSort,
    handleLocationGoalChange, handleLocationMonthPctChange, handleFormulaChange, toggleRepVisibility,
    handleTriggerAppsScript, triggerStatus
  } = useDashboardData(initialViewMode);

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">

        <Header
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          locationKeys={locationKeys}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          setRefreshTrigger={setRefreshTrigger}
          viewMode={viewMode}
          toggleAdminMode={toggleAdminMode}
          setShowManagerSettings={setShowManagerSettings}
          showManagerSettings={showManagerSettings}
        />

        {viewMode === 'admin' ? (
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
            handleTriggerAppsScript={handleTriggerAppsScript}
            triggerStatus={triggerStatus}

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
              />
            )}

            <SummaryCards branchSummary={branchSummary} />

            <MainTable
              processedData={processedData}
              loading={loading}
              sortConfig={sortConfig}
              handleSort={handleSort}
              columns={columns}
              adminSettings={adminSettings}
            />
          </>
        )}
      </div>
    </>
  );
};

export default ReportDashboard;
