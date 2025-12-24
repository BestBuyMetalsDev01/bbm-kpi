import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateTotalWorkDays as getMonthlyWorkDays, calculateElapsedWorkDays as getElapsedWorkDays } from '../utils/dateUtils';
import { filterDataByPeriod, calculateRepMetrics, calculateBranchSummary } from '../utils/calculations';

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
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [triggerStatus, setTriggerStatus] = useState({ loading: false, error: null, success: false });
    const [productsData, setProductsData] = useState([]);

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('bbm_kpi_dark_mode') === 'true';
    });

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dateMode, setDateMode] = useState('monthly'); // 'monthly' or 'ytd'

    const [adminSettings, setAdminSettings] = useState(() => {
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

        const defaults = {
            googleSheetUrl: 'https://script.google.com/macros/s/AKfycbz8DcVQJNh6Tjz_PhVEpGZBjI0INmQLOb1bdB-fyVswITRjmMHffRBoXklyL_zklKp2/exec',
            directoryScriptUrl: 'https://script.google.com/macros/s/AKfycbyGmZ9YQVypq9rhXreQDkOhdn9BNuRKdX4h7XHSOrgKQcNLB6u8t214ycBeHEh3yuzAXQ/exec',
            autoRefreshEnabled: false,
            refreshInterval: 10,
            daysWorked: null,
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
            visibleRepIds: [],
            initializedLocations: [],
            formulas: {
                daysWorked: "Input", expContrib: "Manager", actContrib: "(Rep/Branch)*100",
                totalSalesGoal: "Yearly*Month%", salesOrders: "curOrderTotals",
                toDateSalesGoal: "Goal*(Elapsed/Total)", toDateVariance: "Sales-ToDateGoal",
                salesToMeetGoal: "Goal-Sales", dailySalesGoal: "ToMeet/Remaining",
                orderQty: "intOrders", estDollars: "curQuoted", toDateEstGoal: "EstGoal*Progress",
                estQty: "intQuotes", toDateEstQtyGoal: "EstQtyGoal*Progress",
                invoiceDollars: "curSubTotal", profitDollars: "curInvoiceProfit", invoiceQty: "intInvoices",
                profitPercent: "decProfitPercent", convRateDollars: "(Orders/Est$)*100", convRateQty: "(Orders/EstQty)*100",
                salesOrdersYTD: "curOrderTotalsYTD", orderQtyYTD: "intOrdersYTD", estDollarsYTD: "curQuotedYTD"
            },
            permissions: { 'jacob@bestbuymetals.com': 'admin' }
        };

        try {
            const saved = localStorage.getItem('bbm_kpi_admin_settings');
            if (saved) return { ...defaults, ...JSON.parse(saved) };
        } catch (e) { console.error("Settings parse error:", e); }
        return defaults;
    });

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const fetchedRef = useRef(false);

    // Derived Visibility derived from adminSettings
    const visibleRepIds = useMemo(() => new Set(adminSettings.visibleRepIds || []), [adminSettings.visibleRepIds]);
    const initializedLocationsSet = useMemo(() => new Set(adminSettings.initializedLocations || []), [adminSettings.initializedLocations]);

    const setVisibleRepIds = (newSelection) => {
        setAdminSettings(prev => {
            const currentSet = new Set(prev.visibleRepIds || []);
            const nextSet = typeof newSelection === 'function' ? newSelection(currentSet) : newSelection;
            return { ...prev, visibleRepIds: Array.from(nextSet) };
        });
    };

    // Settings History for Undo/Redo
    const [settingsHistory, setSettingsHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const isUndoRedo = useRef(false);

    // Track settings changes for undo/redo (exclude visibility changes)
    useEffect(() => {
        if (isUndoRedo.current) {
            isUndoRedo.current = false;
            return;
        }
        // Only track meaningful setting changes (repSettings, locationGoals)
        const snapshot = {
            repSettings: JSON.stringify(adminSettings.repSettings),
            locationGoals: JSON.stringify(adminSettings.locationGoals)
        };

        setSettingsHistory(prev => {
            // Don't add duplicate states
            if (prev.length > 0 && historyIndex >= 0) {
                const currentSnap = prev[historyIndex];
                if (currentSnap &&
                    currentSnap.repSettings === snapshot.repSettings &&
                    currentSnap.locationGoals === snapshot.locationGoals) {
                    return prev;
                }
            }

            // Trim future states if we're not at the end
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(snapshot);

            // Keep only last 20 states
            if (newHistory.length > 20) newHistory.shift();

            setHistoryIndex(newHistory.length - 1);
            return newHistory;
        });
    }, [adminSettings.repSettings, adminSettings.locationGoals]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < settingsHistory.length - 1;

    const undoSettings = () => {
        if (!canUndo) return;
        isUndoRedo.current = true;
        const prevIndex = historyIndex - 1;
        const prevState = settingsHistory[prevIndex];
        setAdminSettings(prev => ({
            ...prev,
            repSettings: JSON.parse(prevState.repSettings),
            locationGoals: JSON.parse(prevState.locationGoals)
        }));
        setHistoryIndex(prevIndex);
    };

    const redoSettings = () => {
        if (!canRedo) return;
        isUndoRedo.current = true;
        const nextIndex = historyIndex + 1;
        const nextState = settingsHistory[nextIndex];
        setAdminSettings(prev => ({
            ...prev,
            repSettings: JSON.parse(nextState.repSettings),
            locationGoals: JSON.parse(nextState.locationGoals)
        }));
        setHistoryIndex(nextIndex);
    };


    // Handle initialViewMode updates if props change
    useEffect(() => {
        setViewMode(initialViewMode);
    }, [initialViewMode]);

    // Ensure Manager Settings shows when in Manager Mode
    useEffect(() => {
        setShowManagerSettings(viewMode === 'manager');
        // Force 'All' locations for company comparison to prevent summary mismatch
        if (viewMode === 'comparison' && selectedLocation !== 'All') {
            setSelectedLocation('All');
        }
    }, [viewMode, selectedLocation]);


    // Automatically initialize visibility for a new location the first time it is visited
    useEffect(() => {
        if (!data || data.length === 0 || selectedLocation === 'All') return;

        // Use the current set from settings
        const currentInitialized = new Set(adminSettings.initializedLocations || []);
        if (currentInitialized.has(selectedLocation)) return;

        const currentLocRepos = data.filter(r => r.strDepartment === selectedLocation).map(r => r.strSalesperson);
        if (currentLocRepos.length === 0) return;

        // Check if we already have visibility settings for this location inside the existing visibleRepIds array
        const alreadyHasSelectionsForLoc = currentLocRepos.some(id => visibleRepIds.has(id));

        if (alreadyHasSelectionsForLoc) {
            // We already have some selection history for this branch, so just mark it initialized
            setAdminSettings(prev => ({
                ...prev,
                initializedLocations: Array.from(new Set([...(prev.initializedLocations || []), selectedLocation]))
            }));
            return;
        }

        console.log(`Auto-initializing visibility for first-time visit: ${selectedLocation}`);
        setAdminSettings(prev => ({
            ...prev,
            initializedLocations: Array.from(new Set([...(prev.initializedLocations || []), selectedLocation])),
            visibleRepIds: Array.from(new Set([...(prev.visibleRepIds || []), ...currentLocRepos]))
        }));
    }, [selectedLocation, data.length > 0, adminSettings.initializedLocations?.length]);

    useEffect(() => {
        localStorage.setItem('bbm_kpi_admin_settings', JSON.stringify(adminSettings));
    }, [adminSettings]);


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
                    console.log("[DEBUG] Raw Cloud Settings:", cloudSettings);
                    setAdminSettings(prev => {
                        const merged = {
                            ...prev,
                            ...cloudSettings,
                            // Deep merge repSettings to avoid losing months if cloud version is partial
                            repSettings: {
                                ...prev.repSettings,
                                ...(cloudSettings.repSettings || {})
                            },
                            // Deep merge locationGoals
                            locationGoals: {
                                ...prev.locationGoals,
                                ...(cloudSettings.locationGoals || {})
                            },
                            visibleRepIds: cloudSettings.visibleRepIds && cloudSettings.visibleRepIds.length > 0
                                ? cloudSettings.visibleRepIds
                                : prev.visibleRepIds,
                            initializedLocations: cloudSettings.initializedLocations && cloudSettings.initializedLocations.length > 0
                                ? cloudSettings.initializedLocations
                                : prev.initializedLocations
                        };
                        console.log("[DEBUG] Merged AdminSettings:", merged);
                        return merged;
                    });
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
                    else if (role === 'executive') {
                        setViewMode('comparison');
                        setSelectedLocation('All');
                    }
                    else if (role === 'admin') {
                        setViewMode('admin');
                        setSelectedLocation('All');
                    }

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

            console.log("[DEBUG] Syncing to Cloud. Body:", payload);

            // Reverting to no-cors for Google Apps Script stability. 
            // This bypasses the preflight check which Google usually blocks.
            // Using text/plain is critical to avoid CORS preflight (OPTIONS) requests.
            await fetch(adminSettings.googleSheetUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            // With no-cors, the response is opaque (we can't read it). 
            // We assume it sent successfully if the promise resolved.
            setSaveStatus({ loading: false, success: true, error: null });

            console.log("Cloud sync request sent successfully.");


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
        return getMonthlyWorkDays(selectedDate.getFullYear(), selectedDate.getMonth(), adminSettings.holidays);
    }, [selectedDate, adminSettings.holidays]);

    const calculateElapsedWorkDays = useMemo(() => {
        return getElapsedWorkDays(selectedDate.getFullYear(), selectedDate.getMonth(), adminSettings.holidays);
    }, [selectedDate, adminSettings.holidays]);

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
                    "Order Totals": "curOrderTotals",
                    "Sales Totals": "curOrderTotals",
                    "Orders Count (Current)": "intOrders",
                    "Order Count": "intOrders",
                    "Orders Count": "intOrders",
                    "intOrders": "intOrders",
                    "Quoted (Current)": "curQuoted",
                    "Quoted Totals": "curQuoted",
                    "Quotes Count (Current)": "intQuotes",
                    "Quotes Count": "intQuotes",
                    "Quote Count": "intQuotes",
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

                    // Normalize Departments (Handle 'National Sales' vs 'National' discrepancy)
                    if (obj.strDepartment && typeof obj.strDepartment === 'string') {
                        const dept = obj.strDepartment.trim().toLowerCase();
                        if (dept.startsWith('national') || dept.startsWith('nationsl')) {
                            obj.strDepartment = 'National';
                        }
                    }

                    return obj;
                });

                console.log("Parsed Rows:", rows.length, "Rows with Date:", rows.filter(r => r._parsedDate).length);

                setData(rows);

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
                    const basePerformance = 0.5 + Math.random();

                    [2023, 2024, 2025].forEach(year => {
                        const currentMonth = new Date().getMonth();
                        const monthsToGen = year < 2025 ? 12 : currentMonth + 1;

                        for (let month = 0; month < monthsToGen; month++) {
                            const monthFactor = 0.7 + (Math.random() * 0.6);
                            const yearGrowth = 1 + ((year - 2023) * 0.15);
                            const performanceFactor = basePerformance * monthFactor * yearGrowth;

                            const orderTotal = (80000 / 12) * performanceFactor;
                            const profitPercent = 25 + (Math.random() * 10 - 5);
                            const mockDate = new Date(year, month, 15);

                            mockRows.push({
                                strSalesperson: repId,
                                strName: repName,
                                strDepartment: loc,
                                curOrderTotals: orderTotal,
                                intOrders: Math.floor(1.5 * performanceFactor) || 1,
                                curQuoted: orderTotal * (1.8 + Math.random()),
                                intQuotes: Math.floor(4 * performanceFactor) || 2,
                                curSubTotal: orderTotal * 0.95,
                                curInvoiceProfit: (orderTotal * 0.95) * (profitPercent / 100),
                                intInvoices: Math.floor(1.4 * performanceFactor) || 1,
                                decProfitPercent: profitPercent,
                                _parsedDate: mockDate
                            });
                        }
                    });

                    // Functional update to avoid closure staleness
                    setAdminSettings(prev => {
                        if (prev.repSettings[repId]) return prev;
                        return {
                            ...prev,
                            repSettings: {
                                ...prev.repSettings,
                                [repId]: { targetPct: 10, daysWorked: prev.daysWorked }
                            }
                        };
                    });
                }
            });
            setData(mockRows);
            setLoading(false);
        };

        setTimeout(fetchSheetData, 600);
    }, [adminSettings.googleSheetUrl, refreshTrigger]);

    const companyProcessedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const currentPeriodData = filterDataByPeriod(data, selectedDate, dateMode);
        if (currentPeriodData.length === 0) return [];

        const locationTotals = {};
        currentPeriodData.forEach(row => {
            if (!locationTotals[row.strDepartment]) locationTotals[row.strDepartment] = 0;
            locationTotals[row.strDepartment] += row.curOrderTotals;
        });

        return currentPeriodData.map(row => {
            return calculateRepMetrics(row, {
                adminSettings,
                selectedDate,
                totalDays: calculateTotalWorkDays,
                elapsedDays: calculateElapsedWorkDays,
                locationTotals
            });
        });
    }, [data, selectedDate, dateMode, adminSettings, calculateTotalWorkDays, calculateElapsedWorkDays]);

    const processedData = useMemo(() => {
        if (!companyProcessedData.length) return [];

        let result = [...companyProcessedData];
        if (selectedLocation !== 'All') {
            result = result.filter(item => item.strDepartment === selectedLocation);
        }

        return result.sort((a, b) => {
            const sortKey = sortConfig?.key || 'curOrderTotals';
            const valA = a[sortKey]; const valB = b[sortKey];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [companyProcessedData, selectedLocation, sortConfig]);

    const visibleData = useMemo(() => {
        if (!processedData.length) return [];

        if (viewMode === 'manager' || viewMode === 'viewer') {
            const shownRows = [];
            const misc = {
                strName: 'Misc / Other Reps', strDepartment: selectedLocation, isMisc: true,
                curOrderTotals: 0, intOrders: 0, curQuoted: 0, intQuotes: 0, curSubTotal: 0, curInvoiceProfit: 0, intInvoices: 0,
                curOrderTotalsYTD: 0, intOrdersYTD: 0, curQuotedYTD: 0, actContrib: 0, expContrib: 0, totalSalesGoal: 0, toDateSalesGoal: 0,
                toDateVariance: 0, monthlyVariance: 0, salesToMeetGoal: 0, dailySalesGoal: 0, toDateEstGoal: 0, toDateEstQtyGoal: 0,
                decProfitPercent: 0
            };
            let miscCount = 0;
            processedData.forEach(row => {
                if (visibleRepIds.has(row.strSalesperson)) shownRows.push(row);
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

        return processedData;
    }, [processedData, viewMode, visibleRepIds, sortConfig, adminSettings, calculateElapsedWorkDays]);


    const branchSummary = useMemo(() => {
        const rowsForSummary = companyProcessedData.filter(row =>
            selectedLocation === 'All' || viewMode === 'comparison' || row.strDepartment === selectedLocation
        );

        return calculateBranchSummary(rowsForSummary, {
            selectedLocation: (selectedLocation === 'All' || viewMode === 'comparison') ? 'All' : selectedLocation,
            adminSettings,
            selectedDate,
            dateMode,
            totalDays: calculateTotalWorkDays,
            elapsedDays: calculateElapsedWorkDays
        });
    }, [companyProcessedData, selectedLocation, viewMode, adminSettings, calculateTotalWorkDays, calculateElapsedWorkDays, selectedDate, dateMode]);

    const handleLocationGoalChange = (location, field, value) => {
        setAdminSettings(prev => {
            const currentGoals = prev.locationGoals?.[location] || { yearlySales: 0, monthlyPcts: Array(12).fill(8.33) };

            // For 'est' and 'estQty' we might want to keep them as strings until calculation for better UX 
            // (so users can type '200000' without it jumping to 200000 immediately), 
            // but for safety let's just make sure they update.
            return {
                ...prev,
                locationGoals: {
                    ...prev.locationGoals,
                    [location]: {
                        ...currentGoals,
                        [field]: value
                    }
                }
            };
        });
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
        calculateTotalWorkDays, processedData, visibleData, companyProcessedData, branchSummary, toggleAdminMode, monthNames, handleSort,
        handleLocationGoalChange, handleLocationMonthPctChange, handleFormulaChange, toggleRepVisibility,
        handleTriggerAppsScript, triggerStatus,
        productsData,
        selectedDate, setSelectedDate,
        dateMode, setDateMode,
        calculateElapsedWorkDays,
        // Undo/Redo
        canUndo, canRedo, undoSettings, redoSettings
    };
};
