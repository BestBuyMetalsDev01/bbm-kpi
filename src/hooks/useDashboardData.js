import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const GOOGLE_SHEET_API_URL = "";

export const useDashboardData = (initialViewMode = 'viewer') => {
    const { user, setUser } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'curOrderTotals', direction: 'desc' });
    const [viewMode, setViewMode] = useState(initialViewMode);
    const [userRole, setUserRole] = useState('rep'); // rep, manager, executive, admin
    const [selectedLocation, setSelectedLocation] = useState('Knoxville');
    const [showManagerSettings, setShowManagerSettings] = useState(false);
    const [visibleRepIds, setVisibleRepIds] = useState(new Set());
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [triggerStatus, setTriggerStatus] = useState({ loading: false, error: null, success: false });
    const [productsData, setProductsData] = useState([]);

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('bbm_kpi_dark_mode') === 'true';
    });

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dateMode, setDateMode] = useState('monthly'); // 'monthly' or 'ytd'

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
        const defaults = {
            googleSheetUrl: 'https://script.google.com/macros/s/AKfycbz8DcVQJNh6Tjz_PhVEpGZBjI0INmQLOb1bdB-fyVswITRjmMHffRBoXklyL_zklKp2/exec',
            directoryScriptUrl: 'https://script.google.com/macros/s/AKfycbyGmZ9YQVypq9rhXreQDkOhdn9BNuRKdX4h7XHSOrgKQcNLB6u8t214ycBeHEh3yuzAXQ/exec',
            autoRefreshEnabled: false,
            refreshInterval: 10,
            daysWorked: null, // null means auto-calculate
            holidays: initialHolidays,
            repSettings: {},
            defaultEstGoal: 300000,
            defaultEstQtyGoal: 40,
            locationGoals: {
                "Knoxville": { yearlySales: 15400000, monthlyPcts: [6.1, 6.7, 7.8, 8.6, 9.2, 9.2, 8.9, 9.6, 8.9, 9.6, 7.9, 7.5], profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'Cleveland': { yearlySales: 1000000, monthlyPcts: Array(12).fill(8.33), est: 200000, estQty: 30, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'Chattanooga': { yearlySales: 1200000, monthlyPcts: Array(12).fill(8.33), est: 250000, estQty: 35, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'Dalton': { yearlySales: 900000, monthlyPcts: Array(12).fill(8.33), est: 180000, estQty: 25, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
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
            },
            permissions: {
                'jacob@bestbuymetals.com': 'admin'
            } // email -> role mapping
        };

        try {
            const saved = localStorage.getItem('bbm_kpi_admin_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge saved settings ON TOP of defaults to ensure new keys exist
                const merged = { ...defaults, ...parsed };
                // Ensure Jacob is ALWAYS in permissions even if local storage wiped him
                merged.permissions = { ...defaults.permissions, ...(parsed.permissions || {}) };
                return merged;
            }
        } catch (e) {
            console.error("Failed to parse saved settings", e);
        }
        return defaults;
    });

    // Handle initialViewMode updates if props change
    useEffect(() => {
        setViewMode(initialViewMode);
    }, [initialViewMode]);

    // Ensure Manager Settings shows when in Manager Mode
    useEffect(() => {
        setShowManagerSettings(viewMode === 'manager');
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('bbm_kpi_admin_settings', JSON.stringify(adminSettings));
    }, [adminSettings]);

    // Prevent infinite loops by tracking fetch state
    const fetchedRef = useRef(false);

    // Cloud Persistence: Fetch Settings on Mount
    useEffect(() => {
        // If already fetched or no user email (wait for auth), skip
        if (fetchedRef.current || !user?.email) return;

        // Mark as fetched immediately to prevent race conditions/double invokes
        fetchedRef.current = true;

        if (!adminSettings.googleSheetUrl) return;

        const fetchCloudSettings = async () => {
            console.log("Fetching Cloud Settings...");
            try {
                const separator = adminSettings.googleSheetUrl.includes('?') ? '&' : '?';
                const url = `${adminSettings.googleSheetUrl}${separator}type=settings`;

                const response = await fetch(url);
                const cloudSettings = await response.json();

                if (cloudSettings && Object.keys(cloudSettings).length > 0) {
                    console.log("Cloud Settings Loaded:", cloudSettings);
                    // Update settings only if changed? (Simple spread is fine if effect doesn't depend on it)
                    setAdminSettings(prev => ({ ...prev, ...cloudSettings }));
                }
            } catch (error) {
                console.error("Failed to fetch cloud settings:", error);
            }
        };

        const fetchUserInfo = async () => {
            if (!user?.email) return;

            // Use dedicated Directory URL (or fallback to empty if not set)
            // We default this to the user's provided URL in the initial state if possible, 
            // but for now we'll check if it exists in adminSettings.
            const dirUrl = adminSettings.directoryScriptUrl;

            if (!dirUrl) {
                console.log("No Directory URL configured.");
                return;
            }

            console.log("Fetching User Info from Directory API:", user.email);
            try {
                // The external script likely takes ?email=... directly or might need a 'type' param depending on its code.
                // User said: "instead of integrating ... just do a get request to this one"
                // and provided headers: Location, Department, ...
                // Use usually assumes GET ?email=... returns JSON. 
                // Let's assume it accepts ?email=user@email.com

                const separator = dirUrl.includes('?') ? '&' : '?';
                const url = `${dirUrl}${separator}type=userInfo&email=${encodeURIComponent(user.email)}`;

                const response = await fetch(url);
                const userInfo = await response.json();

                if (userInfo) {
                    console.log("User Directory Info:", userInfo);

                    // 1. Set Location (User said "Department" header maps to location)
                    // The API response keys usually match the headers provided (e.g. "Department", "Job Title")
                    const userLocation = userInfo['Department'];
                    if (userLocation && Object.keys(adminSettings.locationGoals).includes(userLocation)) {
                        setSelectedLocation(userLocation);
                        console.log("Auto-selected Location:", userLocation);
                    }

                    // 2. Set View Mode (Role)
                    const customRole = adminSettings.permissions?.[user.email.toLowerCase()];
                    let role = 'rep';

                    if (user.email.toLowerCase() === 'jacob@bestbuymetals.com') {
                        role = 'admin';
                    } else if (customRole) {
                        console.log("Applying custom permission role:", customRole);
                        role = customRole;
                    } else {
                        const title = (userInfo['Job Title'] || "").toLowerCase();
                        if (title.includes("admin") || title.includes("president") || title.includes("owner")) {
                            role = "admin";
                        } else if (title.includes("executive") || title.includes("director") || title.includes("vp")) {
                            role = "executive";
                        } else if (title.includes("manager")) {
                            role = "manager";
                        }
                    }

                    setUserRole(role);
                    // Default viewMode based on role
                    if (role === 'rep') setViewMode('rep');
                    else if (role === 'manager') setViewMode('viewer');
                    else if (role === 'executive') setViewMode('comparison');
                    else if (role === 'admin') setViewMode('admin');

                    // 3. Save Paradigm Employee ID (if available and not already set)
                    const empId = userInfo['Paradigm Employee ID'];
                    if (empId && user.employeeId !== empId) {
                        console.log("Setting Employee ID:", empId);
                        // We use the exposed setUser from AuthContext to update the global user object
                        // Note: We need to import setUser from useAuth destructuring at the top of the file
                        setUser(prev => ({ ...prev, employeeId: empId, ...userInfo }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user info:", error);
            }
        };

        // Chain the calls: Settings first (to get updated URLs if any), then User Info
        fetchCloudSettings().then(() => {
            fetchUserInfo();
        });

    }, [user?.email]); // Depend only on user.email presence. fetchedRef handles uniqueness.

    // Cloud Persistence: Save Function
    const [saveStatus, setSaveStatus] = useState({ loading: false, success: false, error: null });

    const saveSettingsToCloud = async () => {
        if (!adminSettings.googleSheetUrl) {
            setSaveStatus({ loading: false, success: false, error: "No Script URL configured" });
            return;
        }

        setSaveStatus({ loading: true, success: false, error: null });
        try {
            const payload = {
                action: 'saveSettings',
                settings: adminSettings
            };

            await fetch(adminSettings.googleSheetUrl, {
                method: 'POST',
                mode: 'no-cors', // Apps Script POST often requires no-cors text/plain
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            // Since no-cors returns opaque response, we assume success if no error thrown
            // (or we can try cors if user set "Access: Anyone")
            setSaveStatus({ loading: false, success: true, error: null });

            // Clear success message after 3 seconds
            setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);

        } catch (error) {
            console.error("Save to Cloud Failed:", error);
            setSaveStatus({ loading: false, success: false, error: error.message });
        }
    };


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
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let workDays = 0;
        const holidaySet = new Set(adminSettings.holidays.map(h => h.date));

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dayOfWeek = dateObj.getDay();
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateString)) {
                workDays++;
            }
        }
        return workDays;
    }, [adminSettings.holidays, selectedDate]);

    const calculateElapsedWorkDays = useMemo(() => {
        const todayNow = new Date();
        const viewYear = selectedDate.getFullYear();
        const viewMonth = selectedDate.getMonth();

        // Future month -> 0 days elapsed
        if (viewYear > todayNow.getFullYear() || (viewYear === todayNow.getFullYear() && viewMonth > todayNow.getMonth())) return 0;
        // Past month -> All work days elapsed
        if (viewYear < todayNow.getFullYear() || (viewYear === todayNow.getFullYear() && viewMonth < todayNow.getMonth())) return calculateTotalWorkDays;

        // Current month -> count up to today
        let elapsed = 0;
        const holidaySet = new Set(adminSettings.holidays.map(h => h.date));
        const currentDay = todayNow.getDate();

        for (let day = 1; day <= currentDay; day++) {
            const dateObj = new Date(viewYear, viewMonth, day);
            const dayOfWeek = dateObj.getDay();
            const dateString = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateString)) {
                elapsed++;
            }
        }
        return elapsed;
    }, [adminSettings.holidays, selectedDate, calculateTotalWorkDays]);

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
                    "Quoted YTD": "curQuotedYTD",
                    "Date": "dateStr",
                    "date": "dateStr",
                    "Order Date": "dateStr",
                    "Invoice Date": "dateStr",
                    "Period": "dateStr",
                    "Year": "orderYear",
                    "year": "orderYear",
                    "Month": "orderMonth",
                    "month": "orderMonth"
                };

                const rows = jsonData.slice(1).map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        const key = keyMap[header] || header;
                        const val = row[index];
                        obj[key] = (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') ? Number(val) : val;
                    });

                    // Parse Date Immediately
                    let d = null;
                    if (obj.dateStr) {
                        const s = String(obj.dateStr).trim();
                        // Support Excel serial dates if they come as numbers? JSON usually strings
                        const p = new Date(s);
                        if (!isNaN(p.getTime())) d = p;
                    }
                    else if (obj.orderYear && obj.orderMonth) {
                        const monStr = String(obj.orderMonth).trim();
                        const year = Number(obj.orderYear);
                        let monIdx = -1;
                        if (!isNaN(Date.parse(monStr + " 1, 2000"))) monIdx = new Date(monStr + " 1, 2000").getMonth();
                        else if (!isNaN(Number(monStr))) monIdx = Number(monStr) - 1;
                        else {
                            const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
                            monIdx = months.findIndex(m => monStr.toLowerCase().startsWith(m));
                        }
                        if (monIdx >= 0) d = new Date(year, monIdx, 1);
                    }
                    obj._parsedDate = d;

                    return obj;
                });

                console.log("Parsed Rows:", rows.length, "Rows with Date:", rows.filter(r => r._parsedDate).length);

                setData(rows);
                initVisibleReps(rows);

                // Fetch Product of the Month Data
                try {
                    const separator = url.includes('?') ? '&' : '?';
                    const productsUrl = `${url}${separator}sheet=Product_Of_The_Month`;
                    const productsResponse = await fetch(productsUrl);
                    const pData = await productsResponse.json();
                    if (pData && Array.isArray(pData) && pData.length > 1) {
                        const pHeaders = pData[0];
                        const pRows = pData.slice(1).map(row => {
                            const obj = {};
                            pHeaders.forEach((h, i) => {
                                obj[h] = row[i];
                            });
                            return obj;
                        });
                        setProductsData(pRows);
                    }
                } catch (pe) {
                    console.warn("Failed to fetch Product of the Month data:", pe);
                }

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

    const companyProcessedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const validRows = data.filter(r => r._parsedDate instanceof Date && !isNaN(r._parsedDate));

        let currentPeriodData = [];
        if (validRows.length > 0) {
            const targetMonth = selectedDate.getMonth();
            const targetYear = selectedDate.getFullYear();
            currentPeriodData = data.filter(d => {
                const dDate = d._parsedDate;
                if (!dDate) return false;
                if (dateMode === 'ytd') {
                    return dDate.getFullYear() === targetYear && dDate.getMonth() <= targetMonth;
                }
                return dDate.getMonth() === targetMonth && dDate.getFullYear() === targetYear;
            });
        } else {
            return [];
        }

        const locationTotals = {};
        currentPeriodData.forEach(row => {
            if (!locationTotals[row.strDepartment]) locationTotals[row.strDepartment] = 0;
            locationTotals[row.strDepartment] += row.curOrderTotals;
        });

        return currentPeriodData.map(row => {
            const rowDate = row._parsedDate;
            let repSettings = adminSettings.repSettings?.[row.strSalesperson] || {};

            if (rowDate) {
                const monthKey = `${rowDate.getFullYear()}-${String(rowDate.getMonth() + 1).padStart(2, '0')}`;
                if (repSettings.months?.[monthKey]) {
                    repSettings = { ...repSettings, ...repSettings.months[monthKey] };
                }
            }

            const rw = parseFloat(repSettings.daysWorked) || calculateElapsedWorkDays || 1;
            const totalDays = calculateTotalWorkDays || 20;
            const locGoals = adminSettings.locationGoals[row.strDepartment] || {};
            const currentMonthIndex = rowDate ? rowDate.getMonth() : selectedDate.getMonth();
            const salesGoal = (locGoals.yearlySales || 0) * ((locGoals.monthlyPcts?.[currentMonthIndex] || 8.33) / 100);
            const targetPct = parseFloat(repSettings.targetPct) || 0;
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
                monthlyVariance: row.curOrderTotals - totalSalesGoal,
                salesToMeetGoal,
                dailySalesGoal: salesToMeetGoal > 0 ? salesToMeetGoal / (totalDays - rw) : 0,
                toDateEstGoal: estGoal * (rw / totalDays),
                toDateEstQtyGoal: (locGoals.estQty || adminSettings.defaultEstQtyGoal) * (rw / totalDays),
                convRateDollars: row.curQuoted > 0 ? (row.curOrderTotals / row.curQuoted) * 100 : 0,
                convRateQty: row.intQuotes > 0 ? (row.intOrders / row.intQuotes) * 100 : 0,
                isMisc: false
            };
        });
    }, [data, selectedDate, dateMode, adminSettings, calculateTotalWorkDays, calculateElapsedWorkDays]);

    const processedData = useMemo(() => {
        if (!companyProcessedData.length) return [];

        let result = [...companyProcessedData];
        if (selectedLocation !== 'All') {
            result = result.filter(item => item.strDepartment === selectedLocation);
        }

        if (viewMode === 'manager' || viewMode === 'viewer') {
            const shownRows = [];
            const misc = {
                strName: 'Misc / Other Reps', strDepartment: selectedLocation, isMisc: true,
                curOrderTotals: 0, intOrders: 0, curQuoted: 0, intQuotes: 0, curSubTotal: 0, curInvoiceProfit: 0, intInvoices: 0,
                curOrderTotalsYTD: 0, intOrdersYTD: 0, curQuotedYTD: 0, actContrib: 0, expContrib: 0, totalSalesGoal: 0, toDateSalesGoal: 0,
                toDateVariance: 0, monthlyVariance: 0, salesToMeetGoal: 0, dailySalesGoal: 0, toDateEstGoal: 0, toDateEstQtyGoal: 0
            };
            let miscCount = 0;
            result.forEach(row => {
                if (!visibleRepIds.size || visibleRepIds.has(row.strSalesperson)) shownRows.push(row);
                else {
                    miscCount++; misc.curOrderTotals += row.curOrderTotals; misc.intOrders += row.intOrders; misc.curQuoted += (row.curQuoted || 0);
                    misc.intQuotes += (row.intQuotes || 0); misc.curSubTotal += (row.curSubTotal || 0); misc.curInvoiceProfit += (row.curInvoiceProfit || 0);
                    misc.intInvoices += (row.intInvoices || 0); misc.totalSalesGoal += (row.totalSalesGoal || 0); misc.toDateSalesGoal += (row.toDateSalesGoal || 0);
                    misc.toDateVariance += (row.toDateVariance || 0); misc.monthlyVariance += (row.monthlyVariance || 0); misc.salesToMeetGoal += (row.salesToMeetGoal || 0);
                    misc.dailySalesGoal += (row.dailySalesGoal || 0); misc.toDateEstGoal += (row.toDateEstGoal || 0); misc.toDateEstQtyGoal += (row.toDateEstQtyGoal || 0);
                    misc.actContrib += (row.actContrib || 0); misc.expContrib += (row.expContrib || 0);
                }
            });
            misc.daysWorked = parseFloat(adminSettings.daysWorked) || calculateElapsedWorkDays;
            misc.decProfitPercent = misc.curSubTotal > 0 ? (misc.curInvoiceProfit / misc.curSubTotal) * 100 : 0;
            misc.convRateDollars = misc.curQuoted > 0 ? (misc.curOrderTotals / misc.curQuoted) * 100 : 0;
            misc.convRateQty = misc.intQuotes > 0 ? (misc.intOrders / misc.intQuotes) * 100 : 0;
            if (miscCount > 0) shownRows.push(misc);

            return shownRows.sort((a, b) => {
                if (a.isMisc) return 1; if (b.isMisc) return -1;
                const sortKey = sortConfig?.key || 'curOrderTotals';
                const valA = a[sortKey]; const valB = b[sortKey];
                if (valA < valB) return sortConfig?.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig?.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result.sort((a, b) => {
            const sortKey = sortConfig?.key || 'curOrderTotals';
            if (a.isMisc) return 1; if (b.isMisc) return -1;
            const valA = a[sortKey]; const valB = b[sortKey];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [companyProcessedData, viewMode, selectedLocation, visibleRepIds, sortConfig, adminSettings, calculateElapsedWorkDays]);


    const branchSummary = useMemo(() => {
        let summaryGoal = 0;
        let summaryToDateGoal = 0;
        let summaryEstGoal = 0;
        let summaryToDateEstGoal = 0;
        let summaryEstQtyGoal = 0;

        let targetProfitPct = 0;
        let targetDollarConv = 0;
        let targetQtyConv = 0;

        const currentMonthIndex = selectedDate.getMonth();
        const rw = parseFloat(adminSettings.daysWorked) || calculateElapsedWorkDays || 1;
        const totalDays = calculateTotalWorkDays || 20;
        const progressRatio = rw / totalDays;
        const remainingDays = Math.max(0, totalDays - rw);

        if (selectedLocation === 'All') {
            const locs = Object.values(adminSettings.locationGoals);
            locs.forEach(g => {
                const closeRate = (g.closeRateDollar || 30) / 100;
                if (dateMode === 'ytd') {
                    let locYtdGoal = 0;
                    let locToDateGoal = 0;
                    for (let i = 0; i <= currentMonthIndex; i++) {
                        const monthPct = (g.monthlyPcts && g.monthlyPcts[i]) || 8.33;
                        const monthlySG = (g.yearlySales || 0) * (monthPct / 100);
                        locYtdGoal += monthlySG;
                        if (i < currentMonthIndex) {
                            locToDateGoal += monthlySG;
                        } else {
                            locToDateGoal += monthlySG * progressRatio;
                        }
                    }
                    summaryGoal += locYtdGoal;
                    summaryToDateGoal += locToDateGoal;
                    summaryEstGoal += locYtdGoal / closeRate;
                    summaryToDateEstGoal += locToDateGoal / closeRate;
                    summaryEstQtyGoal += (g.estQty || 0) * (currentMonthIndex + 1) / 12;
                } else {
                    const monthPct = (g.monthlyPcts && g.monthlyPcts[currentMonthIndex]) || 8.33;
                    const sg = (g.yearlySales || 0) * (monthPct / 100);
                    summaryGoal += sg;
                    summaryToDateGoal += sg * progressRatio;
                    summaryEstGoal += sg / closeRate;
                    summaryToDateEstGoal += (sg * progressRatio) / closeRate;
                    summaryEstQtyGoal += (g.estQty || 0);
                }
            });
            if (locs.length > 0) {
                targetProfitPct = locs.reduce((s, l) => s + (l.profitGoal || 0), 0) / locs.length;
                targetDollarConv = locs.reduce((s, l) => s + (l.closeRateDollar || 0), 0) / locs.length;
                targetQtyConv = locs.reduce((s, l) => s + (l.closeRateQty || 0), 0) / locs.length;
            }
        } else {
            const g = adminSettings.locationGoals[selectedLocation] || {};
            const closeRate = (g.closeRateDollar || 30) / 100;
            if (dateMode === 'ytd') {
                for (let i = 0; i <= currentMonthIndex; i++) {
                    const monthPct = (g.monthlyPcts && g.monthlyPcts[i]) || 8.33;
                    const monthlySG = (g.yearlySales || 0) * (monthPct / 100);
                    summaryGoal += monthlySG;
                    if (i < currentMonthIndex) {
                        summaryToDateGoal += monthlySG;
                    } else {
                        summaryToDateGoal += monthlySG * progressRatio;
                    }
                }
                summaryEstGoal = summaryGoal / closeRate;
                summaryToDateEstGoal = summaryToDateGoal / closeRate;
                summaryEstQtyGoal += (g.estQty || 0) * (currentMonthIndex + 1) / 12;
            } else {
                const monthPct = (g.monthlyPcts && g.monthlyPcts[currentMonthIndex]) || 8.33;
                summaryGoal = (g.yearlySales || 0) * (monthPct / 100);
                summaryToDateGoal = summaryGoal * progressRatio;
                summaryEstGoal = summaryGoal / closeRate;
                summaryToDateEstGoal = summaryToDateGoal / closeRate;
                summaryEstQtyGoal = (g.estQty || 0);
            }
            targetProfitPct = g.profitGoal || 0;
            targetDollarConv = g.closeRateDollar || 30;
            targetQtyConv = g.closeRateQty || 0;
        }

        const actuals = processedData
            .filter(row => selectedLocation === 'All' || row.strDepartment === selectedLocation)
            .reduce((acc, row) => ({
                sales: acc.sales + (row.curOrderTotals || 0), orderQty: acc.orderQty + (row.intOrders || 0),
                estDollars: acc.estDollars + (row.curQuoted || 0), estQty: acc.estQty + (row.intQuotes || 0),
                invoiced: acc.invoiced + (row.curSubTotal || 0), profit: acc.profit + (row.curInvoiceProfit || 0),
                invoiceQty: acc.invoiceQty + (row.intInvoices || 0),
            }), { sales: 0, orderQty: 0, estDollars: 0, estQty: 0, invoiced: 0, profit: 0, invoiceQty: 0 });

        return {
            totalSalesGoal: summaryGoal, sales: actuals.sales, toDateSalesGoal: summaryToDateGoal,
            salesVariance: actuals.sales - summaryToDateGoal,
            monthlyVariance: actuals.sales - summaryGoal,
            salesToMeet: Math.max(0, summaryGoal - actuals.sales),
            dailyGoal: remainingDays > 0 ? Math.max(0, summaryGoal - actuals.sales) / remainingDays : 0,
            estDollars: actuals.estDollars, estGoal: summaryEstGoal, toDateEstGoal: summaryToDateEstGoal,
            estVariance: actuals.estDollars - summaryToDateEstGoal,
            dailyEstGoal: remainingDays > 0 ? Math.max(0, summaryEstGoal - actuals.estDollars) / remainingDays : 0,
            estQty: actuals.estQty, toDateEstQtyGoal: summaryEstQtyGoal * progressRatio,
            invoiced: actuals.invoiced, profit: actuals.profit,
            actualProfitPct: actuals.invoiced > 0 ? (actuals.profit / actuals.invoiced) * 100 : 0, targetProfitPct,
            actualDollarConv: actuals.estDollars > 0 ? (actuals.sales / actuals.estDollars) * 100 : 0, targetDollarConv,
            actualQtyConv: actuals.estQty > 0 ? (actuals.orderQty / actuals.estQty) * 100 : 0, targetQtyConv,
            orderQty: actuals.orderQty
        };
    }, [processedData, selectedLocation, adminSettings, calculateTotalWorkDays, selectedDate, dateMode]);

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
        data, loading, sortConfig, viewMode, setViewMode, userRole, selectedLocation, setSelectedLocation,
        showManagerSettings, setShowManagerSettings, visibleRepIds, setVisibleRepIds,
        refreshTrigger, setRefreshTrigger, darkMode, setDarkMode,
        saveSettingsToCloud,
        saveStatus,
        adminSettings, setAdminSettings,
        calculateTotalWorkDays, processedData, companyProcessedData, branchSummary, toggleAdminMode, monthNames, handleSort,
        handleLocationGoalChange, handleLocationMonthPctChange, handleFormulaChange, toggleRepVisibility,
        handleTriggerAppsScript, triggerStatus,
        productsData,
        selectedDate, setSelectedDate,
        dateMode, setDateMode,
        calculateElapsedWorkDays
    };
};
