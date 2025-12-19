import { useState, useEffect, useMemo } from 'react';

const GOOGLE_SHEET_API_URL = "";

export const useDashboardData = (initialViewMode = 'viewer') => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'curOrderTotals', direction: 'desc' });
    const [viewMode, setViewMode] = useState(initialViewMode);
    const [selectedLocation, setSelectedLocation] = useState('Knoxville');
    const [showManagerSettings, setShowManagerSettings] = useState(false);
    const [visibleRepIds, setVisibleRepIds] = useState(new Set());
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [triggerStatus, setTriggerStatus] = useState({ loading: false, error: null, success: false });

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('bbm_kpi_dark_mode') === 'true';
    });

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const initialHolidays = [
        { id: 1, name: "New Year's Day", date: "2025-01-01" },
        { id: 2, name: "Memorial Day", date: "2025-05-26" },
        { id: 3, name: "Independence Day", date: "2025-07-04" },
        { id: 4, name: "Labor Day", date: "2025-09-01" },
        { id: 5, name: "Thanksgiving", date: "2025-11-27" },
        { id: 6, name: "Black Friday", date: "2025-11-28" },
        { id: 7, name: "Christmas Day", date: "2025-12-25" },
        { id: 8, name: "Day After Christmas", date: "2025-12-26" }
    ];

    const [adminSettings, setAdminSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('bbm_kpi_admin_settings');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse saved settings", e);
        }
        return {
            googleSheetUrl: 'https://script.google.com/macros/s/AKfycbz8DcVQJNh6Tjz_PhVEpGZBjI0INmQLOb1bdB-fyVswITRjmMHffRBoXklyL_zklKp2/exec',
            autoRefreshEnabled: false,
            refreshInterval: 10,
            daysWorked: 14,
            holidays: initialHolidays,
            repSettings: {},
            defaultEstGoal: 300000,
            defaultEstQtyGoal: 40,
            locationGoals: {
                'Cleveland': { yearlySales: 1000000, monthlyPcts: Array(12).fill(8.33), est: 200000, estQty: 30, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'Chattanooga': { yearlySales: 1200000, monthlyPcts: Array(12).fill(8.33), est: 250000, estQty: 35, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'Dalton': { yearlySales: 900000, monthlyPcts: Array(12).fill(8.33), est: 180000, estQty: 25, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'Knoxville': { yearlySales: 2400000, monthlyPcts: Array(12).fill(8.33), est: 400000, estQty: 60, profitGoal: 28, closeRateDollar: 35, closeRateQty: 30 },
                'Asheville': { yearlySales: 1500000, monthlyPcts: Array(12).fill(8.33), est: 300000, estQty: 40, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'Greenville': { yearlySales: 1300000, monthlyPcts: Array(12).fill(8.33), est: 280000, estQty: 38, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'Charlotte': { yearlySales: 1800000, monthlyPcts: Array(12).fill(8.33), est: 350000, estQty: 50, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'National': { yearlySales: 5000000, monthlyPcts: Array(12).fill(8.33), est: 800000, estQty: 100, profitGoal: 30, closeRateDollar: 40, closeRateQty: 35 },
            },
            formulas: {
                daysWorked: "Input by Manager/Admin",
                expContrib: "Manager Setting per Rep",
                actContrib: "(Rep Sales / Location Total) * 100",
                totalSalesGoal: "Yearly Goal * Current Month %",
                salesOrders: "SQL: curOrderTotals",
                toDateSalesGoal: "Monthly Goal * (Days Worked / Total Work Days)",
                toDateVariance: "Sales Orders - To Date Goal",
                salesToMeetGoal: "Monthly Goal - Sales Orders",
                dailySalesGoal: "Sales To Meet / Remaining Work Days",
                orderQty: "SQL: intOrders",
                estDollars: "SQL: curQuoted",
                toDateEstGoal: "Branch Est Goal * Progress %",
                estQty: "SQL: intQuotes",
                toDateEstQtyGoal: "Branch Est Qty Goal * Progress %",
                invoiceDollars: "SQL: curSubTotal",
                profitDollars: "SQL: curInvoiceProfit",
                invoiceQty: "SQL: intInvoices",
                profitPercent: "SQL: decProfitPercent",
                convRateDollars: "(Sales Orders / Estimates $) * 100",
                convRateQty: "(Order Qty / Estimate Qty) * 100",
                salesOrdersYTD: "SQL: curOrderTotalsYTD",
                orderQtyYTD: "SQL: intOrdersYTD",
                estDollarsYTD: "SQL: curQuotedYTD"
            }
        };
    });

    // Handle initialViewMode updates if props change
    useEffect(() => {
        setViewMode(initialViewMode);
        if (initialViewMode === 'admin') {
            setShowManagerSettings(false);
        } else if (initialViewMode === 'manager') {
            setShowManagerSettings(true);
        } else {
            setShowManagerSettings(false);
        }
    }, [initialViewMode]);

    useEffect(() => {
        localStorage.setItem('bbm_kpi_admin_settings', JSON.stringify(adminSettings));
    }, [adminSettings]);

    // Auto-Refresh Logic (Polling)
    useEffect(() => {
        if (!adminSettings.autoRefreshEnabled || !adminSettings.googleSheetUrl || !adminSettings.refreshInterval) {
            return;
        }

        const intervalMs = Math.max(1, adminSettings.refreshInterval) * 60 * 1000;
        console.log(`Auto-refresh enabled. Polling data every ${adminSettings.refreshInterval} minutes.`);

        const intervalId = setInterval(() => {
            console.log("Auto-refresh: Fetching new data...");
            setRefreshTrigger(prev => prev + 1);
        }, intervalMs);

        return () => clearInterval(intervalId);
    }, [adminSettings.autoRefreshEnabled, adminSettings.googleSheetUrl, adminSettings.refreshInterval]);

    useEffect(() => {
        localStorage.setItem('bbm_kpi_dark_mode', darkMode);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const calculateTotalWorkDays = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let workDays = 0;
        const holidaySet = new Set(adminSettings.holidays.map(h => h.date));

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dayOfWeek = dateObj.getDay();
            const dateString = dateObj.toISOString().split('T')[0];
            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateString)) {
                workDays++;
            }
        }
        return workDays;
    }, [adminSettings.holidays]);

    useEffect(() => {
        const fetchSheetData = async () => {
            setLoading(true);
            try {
                let url = adminSettings.googleSheetUrl || GOOGLE_SHEET_API_URL;
                if (!url) throw new Error("No API URL");
                if (window.location.hostname === 'localhost' && url.includes('script.google.com')) {
                    const path = url.split('script.google.com')[1];
                    url = `/google-api${path}`;
                }
                const response = await fetch(url);
                const jsonData = await response.json();
                if (!jsonData || jsonData.length < 2) throw new Error("Invalid Data");

                const headers = jsonData[0];
                const keyMap = {
                    "Order Totals (Current)": "curOrderTotals",
                    "Orders Count (Current)": "intOrders",
                    "Quoted (Current)": "curQuoted",
                    "Quotes Count (Current)": "intQuotes",
                    "Sub Total": "curSubTotal",
                    "Invoice Profit": "curInvoiceProfit",
                    "Invoice Count": "intInvoices",
                    "Profit %": "decProfitPercent",
                    "Salesperson ID": "strSalesperson",
                    "Salesperson Name": "strName",
                    "Department Name": "strDepartment",
                    "Order Totals YTD": "curOrderTotalsYTD",
                    "Orders Count YTD": "intOrdersYTD",
                    "Quoted YTD": "curQuotedYTD"
                };

                const rows = jsonData.slice(1).map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        const key = keyMap[header] || header;
                        const val = row[index];
                        obj[key] = (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') ? Number(val) : val;
                    });
                    return obj;
                });

                setData(rows);
                initVisibleReps(rows);
                setLoading(false);
            } catch (error) {
                generateMockData();
            }
        };

        const generateMockData = () => {
            const locations = ['Cleveland', 'Chattanooga', 'Dalton', 'Knoxville', 'Asheville', 'Greenville', 'Charlotte', 'National'];
            const mockRows = [];
            const initialSettings = { ...adminSettings.repSettings };
            let settingsChanged = false;

            locations.forEach(loc => {
                const numReps = Math.floor(Math.random() * 4) + 2;
                for (let i = 1; i <= numReps; i++) {
                    const repId = `${loc.substring(0, 3).toUpperCase()}${i.toString().padStart(3, '0')}`;
                    const repName = `Rep ${i} - ${loc}`;
                    const performanceFactor = 0.5 + Math.random();
                    const orderTotal = 80000 * performanceFactor;
                    const profitPercent = 25 + (Math.random() * 10 - 5);

                    if (!initialSettings[repId]) {
                        initialSettings[repId] = { targetPct: 10, daysWorked: adminSettings.daysWorked };
                        settingsChanged = true;
                    }

                    mockRows.push({
                        strSalesperson: repId,
                        strName: repName,
                        strDepartment: loc,
                        curOrderTotals: orderTotal,
                        intOrders: Math.floor(15 * performanceFactor),
                        curQuoted: orderTotal * (1.8 + Math.random()),
                        intQuotes: Math.floor(40 * performanceFactor),
                        curSubTotal: orderTotal * 0.95,
                        curInvoiceProfit: (orderTotal * 0.95) * (profitPercent / 100),
                        intInvoices: Math.floor(14 * performanceFactor),
                        decProfitPercent: profitPercent,
                        curOrderTotalsYTD: orderTotal * 10,
                        intOrdersYTD: Math.floor(15 * performanceFactor * 10),
                        curQuotedYTD: orderTotal * (1.8 + Math.random()) * 10,
                    });
                }
            });
            setData(mockRows);
            if (settingsChanged) setAdminSettings(prev => ({ ...prev, repSettings: initialSettings }));
            initVisibleReps(mockRows);
            setLoading(false);
        };

        const initVisibleReps = (rows) => {
            const initialVisible = new Set(rows.filter(r => r.strDepartment === 'Knoxville').map(r => r.strSalesperson));
            setVisibleRepIds(initialVisible);
        };

        setTimeout(fetchSheetData, 600);
    }, [adminSettings.googleSheetUrl, refreshTrigger]);

    const processedData = useMemo(() => {
        let result = [...data];
        if (selectedLocation !== 'All') {
            result = result.filter(item => item.strDepartment === selectedLocation);
        }



        // Filter by visible reps
        if (visibleRepIds.size > 0) {
            result = result.filter(item => visibleRepIds.has(item.strSalesperson));
        }
        const locationTotals = {};
        result.forEach(row => {
            if (!locationTotals[row.strDepartment]) locationTotals[row.strDepartment] = 0;
            locationTotals[row.strDepartment] += row.curOrderTotals;
        });

        const calculatedRows = result.map(row => {
            const repSettings = adminSettings.repSettings?.[row.strSalesperson] || {};
            const rw = parseFloat(repSettings.daysWorked) || parseFloat(adminSettings.daysWorked) || 1;
            const totalDays = calculateTotalWorkDays || 20;
            const locGoals = adminSettings.locationGoals[row.strDepartment] || {};
            const currentMonthIndex = new Date().getMonth();
            const salesGoal = (locGoals.yearlySales || 0) * ((locGoals.monthlyPcts?.[currentMonthIndex] || 8.33) / 100);
            const targetPct = repSettings.targetPct || 0;
            const totalSalesGoal = salesGoal * (targetPct / 100);
            const toDateSalesGoal = totalSalesGoal * (rw / totalDays);
            const salesToMeetGoal = totalSalesGoal - row.curOrderTotals;

            const closeRateDollar = locGoals.closeRateDollar || 30;
            const estGoal = totalSalesGoal / (closeRateDollar / 100);

            return {
                ...row,
                month: monthNames[currentMonthIndex],
                updatedDate: new Date().toLocaleDateString(),
                daysWorked: rw,
                expContrib: targetPct,
                actContrib: locationTotals[row.strDepartment] > 0 ? (row.curOrderTotals / locationTotals[row.strDepartment]) * 100 : 0,
                totalSalesGoal,
                toDateSalesGoal,
                toDateVariance: row.curOrderTotals - toDateSalesGoal,
                salesToMeetGoal,
                dailySalesGoal: salesToMeetGoal > 0 ? salesToMeetGoal / (totalDays - rw) : 0,
                toDateEstGoal: estGoal * (rw / totalDays),
                toDateEstQtyGoal: (locGoals.estQty || adminSettings.defaultEstQtyGoal) * (rw / totalDays),
                convRateDollars: row.curQuoted > 0 ? (row.curOrderTotals / row.curQuoted) * 100 : 0,
                convRateQty: row.intQuotes > 0 ? (row.intOrders / row.intQuotes) * 100 : 0,
                isMisc: false
            };
        });

        if (viewMode === 'manager') {
            const shownRows = [];
            const misc = {
                strName: 'Misc / Other Reps', strDepartment: selectedLocation, isMisc: true,
                curOrderTotals: 0, intOrders: 0, curQuoted: 0, intQuotes: 0, curSubTotal: 0, curInvoiceProfit: 0, intInvoices: 0,
                curOrderTotalsYTD: 0, intOrdersYTD: 0, curQuotedYTD: 0, actContrib: 0, expContrib: 0, totalSalesGoal: 0, toDateSalesGoal: 0,
                toDateVariance: 0, salesToMeetGoal: 0, dailySalesGoal: 0, toDateEstGoal: 0, toDateEstQtyGoal: 0
            };
            let miscCount = 0;
            calculatedRows.forEach(row => {
                if (visibleRepIds.has(row.strSalesperson)) shownRows.push(row);
                else {
                    miscCount++; misc.curOrderTotals += row.curOrderTotals; misc.intOrders += row.intOrders; misc.curQuoted += row.curQuoted;
                    misc.intQuotes += row.intQuotes; misc.curSubTotal += row.curSubTotal; misc.curInvoiceProfit += row.curInvoiceProfit;
                    misc.intInvoices += row.intInvoices; misc.totalSalesGoal += row.totalSalesGoal; misc.toDateSalesGoal += row.toDateSalesGoal;
                    misc.toDateVariance += row.toDateVariance; misc.salesToMeetGoal += row.salesToMeetGoal; misc.dailySalesGoal += row.dailySalesGoal;
                    misc.toDateEstGoal += row.toDateEstGoal; misc.toDateEstQtyGoal += row.toDateEstQtyGoal; misc.actContrib += row.actContrib; misc.expContrib += row.expContrib;
                }
            });
            misc.daysWorked = adminSettings.daysWorked;
            misc.decProfitPercent = misc.curSubTotal > 0 ? (misc.curInvoiceProfit / misc.curSubTotal) * 100 : 0;
            misc.convRateDollars = misc.curQuoted > 0 ? (misc.curOrderTotals / misc.curQuoted) * 100 : 0;
            misc.convRateQty = misc.intQuotes > 0 ? (misc.intOrders / misc.intQuotes) * 100 : 0;
            if (miscCount > 0) shownRows.push(misc);
            return shownRows;
        }

        return calculatedRows.sort((a, b) => {
            if (a.isMisc) return 1; if (b.isMisc) return -1;
            const valA = a[sortConfig.key]; const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, viewMode, selectedLocation, visibleRepIds, sortConfig, adminSettings, calculateTotalWorkDays]);

    const branchSummary = useMemo(() => {
        let summaryGoal = 0; let summaryEstGoal = 0; let summaryEstQtyGoal = 0;
        let targetProfitPct = 0; let targetDollarConv = 0; let targetQtyConv = 0;
        const currentMonthIndex = new Date().getMonth();

        if (selectedLocation === 'All') {
            const locs = Object.values(adminSettings.locationGoals);
            locs.forEach(g => {
                const monthPct = (g.monthlyPcts && g.monthlyPcts[currentMonthIndex]) || 8.33;
                const sg = (g.yearlySales || 0) * (monthPct / 100);
                summaryGoal += sg;
                summaryEstGoal += sg / ((g.closeRateDollar || 30) / 100);
                summaryEstQtyGoal += (g.estQty || 0);
            });
            if (locs.length > 0) {
                targetProfitPct = locs.reduce((s, l) => s + (l.profitGoal || 0), 0) / locs.length;
                targetDollarConv = locs.reduce((s, l) => s + (l.closeRateDollar || 0), 0) / locs.length;
                targetQtyConv = locs.reduce((s, l) => s + (l.closeRateQty || 0), 0) / locs.length;
            }
        } else {
            const g = adminSettings.locationGoals[selectedLocation] || {};
            const monthPct = (g.monthlyPcts && g.monthlyPcts[currentMonthIndex]) || 8.33;
            summaryGoal = (g.yearlySales || 0) * (monthPct / 100);
            targetDollarConv = g.closeRateDollar || 0;
            summaryEstGoal = targetDollarConv ? summaryGoal / (targetDollarConv / 100) : 0;
            summaryEstQtyGoal = (g.estQty || 0);
            targetProfitPct = g.profitGoal || 0;
            targetQtyConv = g.closeRateQty || 0;
        }

        const actuals = processedData.reduce((acc, row) => ({
            sales: acc.sales + (row.curOrderTotals || 0), orderQty: acc.orderQty + (row.intOrders || 0),
            estDollars: acc.estDollars + (row.curQuoted || 0), estQty: acc.estQty + (row.intQuotes || 0),
            invoiced: acc.invoiced + (row.curSubTotal || 0), profit: acc.profit + (row.curInvoiceProfit || 0),
            invoiceQty: acc.invoiceQty + (row.intInvoices || 0),
        }), { sales: 0, orderQty: 0, estDollars: 0, estQty: 0, invoiced: 0, profit: 0, invoiceQty: 0 });

        const progressRatio = (parseFloat(adminSettings.daysWorked) || 1) / (calculateTotalWorkDays || 20);
        const remainingDays = Math.max(0, (calculateTotalWorkDays || 20) - (parseFloat(adminSettings.daysWorked) || 1));

        return {
            totalSalesGoal: summaryGoal, sales: actuals.sales, toDateSalesGoal: summaryGoal * progressRatio,
            salesVariance: actuals.sales - (summaryGoal * progressRatio),
            salesToMeet: Math.max(0, summaryGoal - actuals.sales),
            dailyGoal: remainingDays > 0 ? Math.max(0, summaryGoal - actuals.sales) / remainingDays : 0,
            estDollars: actuals.estDollars, estGoal: summaryEstGoal, toDateEstGoal: summaryEstGoal * progressRatio,
            estVariance: actuals.estDollars - (summaryEstGoal * progressRatio),
            dailyEstGoal: remainingDays > 0 ? Math.max(0, summaryEstGoal - actuals.estDollars) / remainingDays : 0,
            estQty: actuals.estQty, toDateEstQtyGoal: summaryEstQtyGoal * progressRatio,
            invoiced: actuals.invoiced, profit: actuals.profit,
            actualProfitPct: actuals.invoiced > 0 ? (actuals.profit / actuals.invoiced) * 100 : 0, targetProfitPct,
            actualDollarConv: actuals.estDollars > 0 ? (actuals.sales / actuals.estDollars) * 100 : 0, targetDollarConv,
            actualQtyConv: actuals.estQty > 0 ? (actuals.orderQty / actuals.estQty) * 100 : 0, targetQtyConv,
            orderQty: actuals.orderQty
        };
    }, [processedData, selectedLocation, adminSettings, calculateTotalWorkDays]);

    const handleLocationGoalChange = (location, field, value) => {
        setAdminSettings(prev => ({
            ...prev,
            locationGoals: {
                ...prev.locationGoals,
                [location]: {
                    ...(prev.locationGoals[location] || { yearlySales: 0, monthlyPcts: Array(12).fill(0) }),
                    [field]: parseFloat(value) || 0
                }
            }
        }));
    };

    const handleLocationMonthPctChange = (location, monthIndex, value) => {
        setAdminSettings(prev => {
            const currentLoc = prev.locationGoals[location] || { yearlySales: 0, monthlyPcts: Array(12).fill(0) };
            const newPcts = [...(currentLoc.monthlyPcts || Array(12).fill(0))];
            newPcts[monthIndex] = parseFloat(value) || 0;
            return { ...prev, locationGoals: { ...prev.locationGoals, [location]: { ...currentLoc, monthlyPcts: newPcts } } };
        });
    };

    const handleFormulaChange = (key, value) => setAdminSettings(prev => ({ ...prev, formulas: { ...prev.formulas, [key]: value } }));

    const toggleRepVisibility = (repId) => {
        const newSet = new Set(visibleRepIds);
        if (newSet.has(repId)) newSet.delete(repId); else newSet.add(repId);
        setVisibleRepIds(newSet);
    };

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
    };

    const toggleAdminMode = () => {
        setViewMode(prev => prev === 'admin' ? 'manager' : 'admin');
        setShowManagerSettings(false);
    };

    const handleTriggerAppsScript = async () => {
        const url = adminSettings.googleSheetUrl;
        if (!url) {
            setTriggerStatus({ loading: false, error: "Trigger URL is required.", success: false });
            return;
        }

        setTriggerStatus({ loading: true, error: null, success: false });

        try {
            // Google Apps Script Web Apps allow POST requests but often require 'no-cors' mode 
            // IF we assume the client is strictly browser-based and the script returns opaque response.
            // However, the user prompt suggests standard 'POST' and expecting JSON.
            // We'll try standard CORS request first. 
            // IMPORTANT: Google Apps Script Web Apps follow redirects (302).

            // Simple payload as requested
            const payload = {};

            const response = await fetch(url, {
                method: 'POST',
                // mode: 'no-cors', // If strictly needed, but let's try standard first as user implied JSON response
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            // If mode is 'no-cors', response.ok is false and status is 0. 
            // We can't read the body. We assume success if no error thrown?
            // But the user prompt says "The script will return a JSON object".
            // This implies normal CORS access or a server-side proxy.
            // Let's assume the script headers are set to allow CORS or it's a standard access.

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Trigger failed: ${response.status} ${text}`);
            }

            const json = await response.json();

            if (json.status === 'error') {
                throw new Error(json.message || "Script reported an error.");
            }

            console.log("Trigger successful:", json);
            setTriggerStatus({ loading: false, error: null, success: true });

            // Refresh data from the *Sheet* (GET request)
            setRefreshTrigger(prev => prev + 1);

            // Clear success message after delay
            setTimeout(() => setTriggerStatus(prev => ({ ...prev, success: false })), 5000);

        } catch (error) {
            console.error("Trigger error:", error);
            setTriggerStatus({ loading: false, error: error.message, success: false });
        }
    };

    return {
        data, loading, sortConfig, viewMode, setViewMode, selectedLocation, setSelectedLocation,
        showManagerSettings, setShowManagerSettings, visibleRepIds, setVisibleRepIds,
        refreshTrigger, setRefreshTrigger, darkMode, setDarkMode, adminSettings, setAdminSettings,
        calculateTotalWorkDays, processedData, branchSummary, toggleAdminMode, monthNames, handleSort,
        handleLocationGoalChange, handleLocationMonthPctChange, handleFormulaChange, toggleRepVisibility,
        handleTriggerAppsScript, triggerStatus
    };
};
