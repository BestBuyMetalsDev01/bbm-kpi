import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateTotalWorkDays as getMonthlyWorkDays, calculateElapsedWorkDays as getElapsedWorkDays } from '../utils/dateUtils';
import { filterDataByPeriod, calculateRepMetrics, calculateBranchSummary } from '../utils/calculations';
import { supabase } from '../utils/supabase';


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
        const saved = localStorage.getItem('bbm_kpi_dark_mode');
        return saved === null ? true : saved === 'true';
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
                "KNOX": { yearlySales: 15400000, monthlyPcts: [6.1, 6.7, 7.8, 8.6, 9.2, 9.2, 8.9, 9.6, 8.9, 9.6, 7.9, 7.5], profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'CLEV': { yearlySales: 1000000, monthlyPcts: Array(12).fill(8.33), est: 200000, estQty: 30, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'CHAT': { yearlySales: 1200000, monthlyPcts: Array(12).fill(8.33), est: 250000, estQty: 35, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'DALT': { yearlySales: 900000, monthlyPcts: Array(12).fill(8.33), est: 180000, estQty: 25, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'ASHE': { yearlySales: 1500000, monthlyPcts: Array(12).fill(8.33), est: 300000, estQty: 40, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'GREE': { yearlySales: 1300000, monthlyPcts: Array(12).fill(8.33), est: 280000, estQty: 38, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'CHAR': { yearlySales: 1800000, monthlyPcts: Array(12).fill(8.33), est: 350000, estQty: 50, profitGoal: 25, closeRateDollar: 30, closeRateQty: 25 },
                'NATI': { yearlySales: 5000000, monthlyPcts: Array(12).fill(8.33), est: 800000, estQty: 100, profitGoal: 30, closeRateDollar: 40, closeRateQty: 35 },
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

    // Rep Visibility is now tracked per branch in rep_settings table.
    // In local state, we'll keep a map of branch_id -> Set of visible salesperson_ids
    const [branchVisibility, setBranchVisibility] = useState({});

    const visibleRepIds = useMemo(() => {
        return new Set(branchVisibility[selectedLocation] || []);
    }, [branchVisibility, selectedLocation]);

    const setVisibleRepIds = (newSelection, branchId = selectedLocation) => {
        setBranchVisibility(prev => {
            const currentSet = new Set(prev[branchId] || []);
            const nextSet = typeof newSelection === 'function' ? newSelection(currentSet) : newSelection;
            return { ...prev, [branchId]: Array.from(nextSet) };
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

    // Ensure Manager Settings shows when in Manager Mode (but never for reps)
    useEffect(() => {
        if (userRole === 'rep') {
            setShowManagerSettings(false);
        } else {
            setShowManagerSettings(viewMode === 'manager');
        }

        // Force 'All' locations for company comparison to prevent summary mismatch
        if (viewMode === 'comparison' && selectedLocation !== 'All') {
            setSelectedLocation('All');
        }
    }, [viewMode, selectedLocation, userRole]);


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


    // Cloud Persistence: Sync Everything from Supabase on Mount
    useEffect(() => {
        if (fetchedRef.current || !user?.email) return;
        fetchedRef.current = true;

        const syncInitialData = async () => {
            console.log("Supabase: Atomic Sync starting for:", user.email);
            try {
                // 1. Fetch Global Config (legacy primary row, but now only for URLs/Formulas)
                const { data: globalRows } = await supabase.from('dashboard_settings').select('data').eq('id', 'primary');
                const globalData = globalRows?.[0]?.data || {};

                // 2. Fetch Branch Settings
                const { data: branchRows } = await supabase.from('branch_settings').select('*');
                const locationGoals = {};
                if (branchRows) {
                    branchRows.forEach(row => {
                        locationGoals[row.branch_id] = {
                            yearlySales: 0, // Fallback
                            ...row.yearly_sales, // Spreads yearlySales2024, etc.
                            monthlyPcts: row.monthly_pcts,
                            profitGoal: row.profit_goal,
                            closeRateDollar: row.close_rate_dollar,
                            closeRateQty: row.close_rate_qty,
                            metadata: row.metadata
                        };
                    });
                }

                // 3. Fetch Rep Settings (Visibility, Days, Targets)
                const { data: repRows } = await supabase.from('rep_settings').select('*');
                const repSettingsMap = {}; // { [branchId]: { [repId]: settings } }
                const visibilityMap = {};

                if (repRows) {
                    repRows.forEach(row => {
                        const sid = row.salesperson_id;
                        const bid = row.branch_id;

                        // Per-Store Settings structure
                        if (!repSettingsMap[bid]) repSettingsMap[bid] = {};
                        if (!repSettingsMap[bid][sid]) repSettingsMap[bid][sid] = { months: {} };

                        repSettingsMap[bid][sid] = {
                            ...repSettingsMap[bid][sid],
                            daysWorked: row.days_worked,
                            targetPct: row.target_pct,
                            ...row.metadata // Merges personal goals
                        };

                        // Visibility (Per Branch)
                        if (!visibilityMap[bid]) visibilityMap[bid] = [];
                        if (row.is_visible) visibilityMap[bid].push(sid);
                    });
                }

                // 4. Fetch Holidays
                const { data: holidayRows } = await supabase.from('holidays').select('*').order('date', { ascending: true });

                // --- Migration Logic ---
                // If branch_settings is empty but legacy globalData.locationGoals exists, migrate it
                if ((!branchRows || branchRows.length === 0) && globalData.locationGoals) {
                    console.log("Supabase Migration: Populating branch_settings from legacy data...");
                    for (const [bid, goal] of Object.entries(globalData.locationGoals)) {
                        const yearlySales = {};
                        Object.keys(goal).forEach(k => { if (k.startsWith('yearlySales')) yearlySales[k] = goal[k]; });
                        await supabase.from('branch_settings').upsert({
                            branch_id: bid,
                            yearly_sales: yearlySales,
                            monthly_pcts: goal.monthlyPcts,
                            profit_goal: goal.profitGoal,
                            close_rate_dollar: goal.closeRateDollar,
                            close_rate_qty: goal.closeRateQty,
                            metadata: goal.metadata || {}
                        });
                        locationGoals[bid] = goal;
                    }
                }

                // If rep_settings is empty but legacy globalData.repSettings exists, migrate it
                if ((!repRows || repRows.length === 0) && globalData.repSettings) {
                    console.log("Supabase Migration: Populating rep_settings from legacy data...");
                    for (const [sid, rep] of Object.entries(globalData.repSettings)) {
                        // For migration, we might not know the branch, but we can try to guess or just store as is
                        // Actually, legacy repSettings didn't have branch_id. 
                        // We'll iterate through all locations and if the rep belongs there, we save.
                        // For simplicity, we'll just migrate the visibility to the branch visibility map for now
                    }
                }

                // If holidays is empty but legacy globalData.holidays exists, migrate it
                if ((!holidayRows || holidayRows.length === 0) && globalData.holidays) {
                    console.log("Supabase Migration: Populating holidays from legacy data...");
                    for (const h of globalData.holidays) {
                        await supabase.from('holidays').upsert({ name: h.name, date: h.date });
                    }
                }

                // Merge into local adminSettings state
                setAdminSettings(prev => ({
                    ...prev,
                    ...globalData,
                    locationGoals: { ...prev.locationGoals, ...locationGoals },
                    repSettings: { ...prev.repSettings, ...repSettingsMap },
                    holidays: holidayRows?.length > 0 ? holidayRows : (globalData.holidays || prev.holidays)
                }));

                setBranchVisibility(visibilityMap);

                console.log("Supabase: Atomic Sync complete.");

                // 2. Fetch User/Employee Info
                const userEmail = user.email.toLowerCase();
                const { data: empRows, error: empError } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('email', userEmail);

                const empInfo = empRows && empRows.length > 0 ? empRows[0] : null;

                if (empError) {
                    console.error("Supabase: Employee fetch error (This is expected if user is not in directory):", empError);
                }

                // Assign roles regardless of whether employee lookup succeeded (fallback to rep or admin check)
                const customRole = adminSettings.permissions?.[userEmail];
                let role = 'rep';

                // Super Admin Override
                if (userEmail === 'jacob@bestbuymetals.com' || userEmail === 'nathan@bestbuymetals.com') {
                    role = 'admin';
                } else if (customRole) {
                    role = customRole;
                } else if (empInfo) {
                    const title = empInfo.job_title?.toLowerCase() || '';
                    if (title.includes('manager')) role = 'manager';
                    else if (title.includes('admin')) role = 'admin';
                    else if (title.includes('executive')) role = 'executive';
                }

                console.log(`Supabase: Resolved User Role: ${role}`);
                setUserRole(role);

                // Initial Location handling
                const userMetadata = empInfo?.metadata || {};
                const defaultLoc = userMetadata.defaultLocation;

                if (defaultLoc && Object.keys(adminSettings.locationGoals).includes(defaultLoc)) {
                    console.log("Supabase: Applying user-specific default location:", defaultLoc);
                    setSelectedLocation(defaultLoc);
                } else if (empInfo?.department && Object.keys(adminSettings.locationGoals).includes(empInfo.department)) {
                    console.log("Supabase: Applying assigned department as default:", empInfo.department);
                    setSelectedLocation(empInfo.department);
                }

                // Initial View Mode logic
                if (role === 'rep') setViewMode('rep');
                else if (role === 'manager') setViewMode('viewer');
                else if (role === 'admin' || role === 'executive') {
                    setViewMode(role === 'admin' ? 'admin' : 'comparison');
                    setSelectedLocation('All');
                }

                // Update context user with database info (carefully merge metadata)
                if (empInfo) {
                    setUser(prev => {
                        const mergedMetadata = {
                            ...(prev?.metadata || {}),
                            ...(empInfo.metadata || {})
                        };
                        return {
                            ...prev,
                            ...empInfo,
                            metadata: mergedMetadata,
                            employeeId: empInfo.employee_id || prev?.employeeId
                        };
                    });
                }
            } catch (err) {
                console.error("Supabase sync failed:", err);
            }
        };

        syncInitialData();
    }, [user?.email]);

    // Atomic Save Functions
    const [saveStatus, setSaveStatus] = useState({ loading: false, success: false, error: null });

    const _performBranchSave = async (branchId) => {
        const goal = adminSettings.locationGoals[branchId];
        if (!goal) throw new Error("No settings found for branch: " + branchId);

        const yearlySales = {};
        Object.keys(goal).forEach(k => { if (k.startsWith('yearlySales')) yearlySales[k] = goal[k]; });

        const payload = {
            branch_id: branchId,
            yearly_sales: yearlySales,
            monthly_pcts: goal.monthlyPcts,
            profit_goal: goal.profitGoal,
            close_rate_dollar: goal.closeRateDollar,
            close_rate_qty: goal.closeRateQty,
            metadata: goal.metadata || {},
            updated_at: new Date()
        };

        const { error } = await supabase.from('branch_settings').upsert(payload);
        if (error) throw error;
    };

    const saveBranchSettings = async (branchId) => {
        setSaveStatus({ loading: true, success: false, error: null });
        try {
            await _performBranchSave(branchId);
            setSaveStatus({ loading: false, success: true, error: null });
            setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
            return { success: true };
        } catch (error) {
            console.error("Supabase Branch Save Failed:", error);
            setSaveStatus({ loading: false, success: false, error: error.message });
            return { success: false, error: error.message };
        }
    };

    const saveRepSettings = async (salespersonId, branchId) => {
        setSaveStatus({ loading: true, success: false, error: null });
        try {
            // Need a branch ID to save settings. If map passed "Knoxville", convert to "KNOX"
            // Simple lookup reverse map
            const nameToId = {
                'Knoxville': 'KNOX', 'Cleveland': 'CLEV', 'Chattanooga': 'CHAT', 'Dalton': 'DALT',
                'Asheville': 'ASHE', 'Greenville': 'GREE', 'Charlotte': 'CHAR', 'National': 'NATI',
                'All': 'All'
            };
            const bid = nameToId[branchId] || branchId;

            const repSet = adminSettings.repSettings?.[bid]?.[salespersonId] || {};
            // If checking visibility, we need to know current state. We have visibleRepIds set for selectedLocation.
            // But saving visibility is done via a different flow usually?
            // Actually, visibility is saved here too? No, toggleRepVisibility updates state, but doesn't persist to DB immediately? 
            // Wait, previous code didn't save visibility here. It fetched it row.is_visible. 
            // We need to pass is_visible to upsert.

            // Note: toggleRepVisibility should probably trigger a save, or saveRepSettings should include it.
            // For now, let's assume we read from branchVisibility state
            const isVisible = branchVisibility[bid]?.includes(salespersonId) ?? true;

            const payload = {
                salesperson_id: salespersonId,
                branch_id: bid,
                days_worked: repSet.daysWorked || 0,
                target_pct: repSet.targetPct || 0,
                is_visible: isVisible,
                metadata: { months: repSet.months },
                updated_at: new Date()
            };

            const { error } = await supabase.from('rep_settings').upsert(payload);
            if (error) throw error;

            setSaveStatus({ loading: false, success: true, error: null });
            setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
            return { success: true };
        } catch (error) {
            console.error("Supabase Rep Save Failed:", error);
            setSaveStatus({ loading: false, success: false, error: error.message });
            return { success: false, error: error.message };
        }
    };


    const saveAllBranchSettings = async () => {
        setSaveStatus({ loading: true, success: false, error: null });
        try {
            const branchIds = Object.keys(adminSettings.locationGoals);
            for (const bid of branchIds) {
                await _performBranchSave(bid);
            }
            setSaveStatus({ loading: false, success: true, error: null });
            setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
        } catch (error) {
            console.error("Supabase Save All Branches Failed:", error);
            setSaveStatus({ loading: false, success: false, error: error.message });
        }
    };
    const saveGlobalConfig = async () => {
        setSaveStatus({ loading: true, success: false, error: null });
        try {
            const config = {
                googleSheetUrl: adminSettings.googleSheetUrl,
                directoryScriptUrl: adminSettings.directoryScriptUrl,
                autoRefreshEnabled: adminSettings.autoRefreshEnabled,
                refreshInterval: adminSettings.refreshInterval,
                daysWorked: adminSettings.daysWorked, // Global override
                formulas: adminSettings.formulas,
                permissions: adminSettings.permissions
            };

            const { error } = await supabase.from('dashboard_settings').upsert({ id: 'primary', data: config, updated_at: new Date() });
            if (error) throw error;

            setSaveStatus({ loading: false, success: true, error: null });
            setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
        } catch (error) {
            console.error("Supabase Global Save Failed:", error);
            setSaveStatus({ loading: false, success: false, error: error.message });
        }
    };

    const saveHolidays = async () => {
        setSaveStatus({ loading: true, success: false, error: null });
        try {
            // This is a bit more complex as it's a list. We'll replace all if we want to be simple, 
            // or do individual upserts. Let's do a batch upsert.
            const { error } = await supabase.from('holidays').upsert(adminSettings.holidays.map(h => ({
                id: h.id > 1000 ? undefined : h.id, // New ones won't have serial ID yet
                name: h.name,
                date: h.date
            })));
            if (error) throw error;

            setSaveStatus({ loading: false, success: true, error: null });
            setTimeout(() => setSaveStatus(prev => ({ ...prev, success: false })), 3000);
        } catch (error) {
            console.error("Supabase Holiday Save Failed:", error);
            setSaveStatus({ loading: false, success: false, error: error.message });
        }
    };


    const updateUserDefaultLocation = async (location) => {
        if (!user?.email) {
            console.error("Supabase: Cannot update default location - No user email found.");
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const userEmail = user.email.toLowerCase();
            console.log(`Supabase: Pinning default location: ${location} for ${userEmail}`);

            // 1. Fetch current record to preserve metadata and other fields
            const { data: empRows, error: fetchError } = await supabase
                .from('employees')
                .select('*')
                .eq('email', userEmail);

            if (fetchError) throw fetchError;

            const existingUser = empRows?.[0] || {};
            const currentMetadata = existingUser.metadata || {};
            const newMetadata = { ...currentMetadata, defaultLocation: location };

            const payload = {
                email: userEmail,
                name: user.name || existingUser.name || 'Dashboard User',
                metadata: newMetadata,
                // Automatically assign department if the user doesn't have one yet
                department: existingUser.department || location
            };

            console.log("Supabase: UPSERT Payload:", JSON.stringify(payload, null, 2));

            // 2. Use upsert to handle both updates and initial creations
            const { data, error: upsertError } = await supabase
                .from('employees')
                .upsert(payload, { onConflict: 'email' })
                .select();

            if (upsertError) {
                console.group("Supabase Upsert Failure");
                console.error("Error Code:", upsertError.code);
                console.error("Message:", upsertError.message);
                console.error("Details:", upsertError.details);
                console.groupEnd();
                throw upsertError;
            }

            console.log("Supabase: SUCCESSFULLY saved to DB:", data);

            // 3. Update local state so UI reflects change immediately
            setUser(prev => ({
                ...prev,
                metadata: newMetadata,
                department: payload.department // Sync the department too
            }));

            return { success: true };
        } catch (error) {
            console.error("Supabase: Failed to pin default location:", error);
            return { success: false, error: error.message };
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
        const fetchSupabaseData = async () => {
            setLoading(true);
            try {
                console.log("Supabase: Fetching KPI data for dashboard...");
                // 1. Fetch KPI data with pagination
                let allKpiData = [];
                let from = 0;
                let step = 1000;
                let hasMore = true;

                while (hasMore) {
                    const { data: kpiPage, error: kpiError } = await supabase
                        .from('kpi_data')
                        .select('*')
                        .range(from, from + step - 1);

                    if (kpiError) throw kpiError;

                    if (kpiPage && kpiPage.length > 0) {
                        allKpiData = [...allKpiData, ...kpiPage];
                        from += step;
                        // If we got fewer than the step size, we've reached the end
                        if (kpiPage.length < step) hasMore = false;
                        // Safety cap at 50,000 rows to prevent infinite loops/memory issues
                        if (allKpiData.length >= 50000) hasMore = false;
                    } else {
                        hasMore = false;
                    }
                }

                console.log(`Supabase: Received ${allKpiData.length} KPI rows total.`);

                if (allKpiData.length > 0) {
                    const years = [...new Set(allKpiData.map(r => new Date(r.period_date).getFullYear()))].sort();
                    console.log(`Supabase: Data available for years: ${years.join(', ')}`);
                }

                const rows = allKpiData.map(item => {
                    // Timezone safe date parsing (ensures YYYY-MM-DD is treated as local 00:00:00)
                    let pDate = new Date(item.period_date);
                    if (item.period_date && typeof item.period_date === 'string' && item.period_date.includes('-')) {
                        // Force local time by appending T00:00:00 if not already present
                        const dateStr = item.period_date.split('T')[0] + 'T00:00:00';
                        pDate = new Date(dateStr);
                    }

                    // Map Department IDs to Location Names (All IDs are 4 characters)
                    const deptMap = {
                        'NATI': 'National',
                        'KNOX': 'Knoxville',
                        'CLEV': 'Cleveland',
                        'CHAT': 'Chattanooga',
                        'DALT': 'Dalton',
                        'ASHE': 'Asheville',
                        'GREE': 'Greenville',
                        'CHAR': 'Charlotte'
                    };

                    const rawDept = item.department || '';
                    const deptId = (item.department_id || '').trim().toUpperCase();

                    // Priority: Mapping ID -> Raw Name -> "Unknown"
                    const mappedDept = deptMap[deptId] || rawDept;

                    return {
                        strSalesperson: (item.salesperson_id || '').trim().toUpperCase(),
                        strName: item.salesperson_name,
                        strDepartment: mappedDept,
                        strDepartmentID: deptId,
                        curOrderTotals: item.order_totals || 0,
                        intOrders: item.order_count || 0,
                        curQuoted: item.quoted_amount || 0,
                        intQuotes: item.quote_count || 0,
                        curSubTotal: item.sub_total || 0,
                        decProfitPercent: item.profit_percent || 0,
                        curInvoiceProfit: item.invoice_profit || 0,
                        intInvoices: item.invoice_count || 0,
                        curOrderTotalsYTD: item.order_totals_ytd || 0,
                        intOrdersYTD: item.order_count_ytd || 0,
                        curQuotedYTD: item.quoted_amount_ytd || 0,
                        intQuotesYTD: item.quote_count_ytd || 0,
                        curSubTotalLast30: item.sub_total_last_30 || 0,
                        decProfitPercentLast30: item.profit_percent_last_30 || 0,
                        _parsedDate: pDate
                    };
                });

                setData(rows);

                // 2. Fetch Products
                const { data: pData, error: pError } = await supabase
                    .from('products_of_the_month')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (pError) {
                    console.error("Supabase Product Fetch Error:", pError);
                    setProductsData([]);
                } else {
                    console.log(`Supabase: Received ${pData?.length || 0} product rows.`);
                    if (pData?.length === 0) {
                        console.warn("Supabase: products_of_the_month table is EMPTY. Please run Sync Now.");
                    }
                    setProductsData(pData || []);
                }

                setLoading(false);
            } catch (error) {
                console.error("Supabase fetch error:", error);
                setData([]);
                setLoading(false);
            }
        };

        fetchSupabaseData();
    }, [refreshTrigger]);

    // Auto-select latest date if current date has no data
    useEffect(() => {
        if (!loading && data.length > 0) {
            const currentPeriodData = filterDataByPeriod(data, selectedDate, dateMode);

            if (currentPeriodData.length === 0) {
                // Find latest date in data
                const latest = data.reduce((max, row) => {
                    const d = row._parsedDate;
                    if (!d || isNaN(d.getTime())) return max;
                    return (!max || d > max) ? d : max;
                }, null);

                if (latest) {
                    console.log("Dashboard: No data for current selection. Auto-selecting latest available date:", latest.toLocaleDateString());
                    // Create a new date object for the first of that month
                    setSelectedDate(new Date(latest.getFullYear(), latest.getMonth(), 1));
                }
            }
        }
    }, [data, loading, dateMode]);

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

        // Apply visibility filtering for ALL roles if we are looking at a specific branch
        // (Previously restricted to manager/viewer, causing filtering to have "no effect" for admins)
        if (selectedLocation !== 'All') {
            const shownRows = [];
            const misc = {
                strName: 'Misc / Other Reps', strDepartment: selectedLocation, isMisc: true,
                curOrderTotals: 0, intOrders: 0, curQuoted: 0, intQuotes: 0, curSubTotal: 0, curInvoiceProfit: 0, intInvoices: 0,
                curOrderTotalsYTD: 0, intOrdersYTD: 0, curQuotedYTD: 0, actContrib: 0, expContrib: 0, totalSalesGoal: 0, toDateSalesGoal: 0,
                toDateVariance: 0, monthlyVariance: 0, salesToMeetGoal: 0, dailySalesGoal: 0, toDateEstGoal: 0, toDateEstQtyGoal: 0,
                decProfitPercent: 0
            };
            let miscCount = 0;

            console.log(`Dashboard: Processing visibility for ${processedData.length} rows. Visible IDs:`, Array.from(visibleRepIds));

            processedData.forEach(row => {
                const isVisible = visibleRepIds.has(row.strSalesperson);
                if (isVisible) {
                    shownRows.push(row);
                } else {
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

            console.log(`Dashboard: Visibility filter result -> ${shownRows.length} rows shown.`);

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
    }, [processedData, viewMode, visibleRepIds, sortConfig, adminSettings, calculateElapsedWorkDays, selectedLocation]);


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
        setVisibleRepIds(newSet, selectedLocation);
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
        setTriggerStatus({ loading: true, error: null, success: false });
        try {
            const url = adminSettings.googleSheetUrl;
            if (!url) throw new Error("Trigger URL not configured.");

            const response = await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'triggerSync' })
            });

            setTriggerStatus({ loading: false, error: null, success: true });
            setTimeout(() => setTriggerStatus(prev => ({ ...prev, success: false })), 5000);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            setTriggerStatus({ loading: false, error: error.message, success: false });
        }
    };

    return {
        data, loading, sortConfig, viewMode, setViewMode, userRole, selectedLocation, setSelectedLocation,
        showManagerSettings, setShowManagerSettings, visibleRepIds, setVisibleRepIds,
        refreshTrigger, setRefreshTrigger, darkMode, setDarkMode,
        saveStatus,
        adminSettings, setAdminSettings,
        calculateTotalWorkDays, processedData, visibleData, companyProcessedData, branchSummary, toggleAdminMode, monthNames, handleSort,
        handleLocationGoalChange, handleLocationMonthPctChange, handleFormulaChange, toggleRepVisibility,
        handleTriggerAppsScript, triggerStatus,
        productsData,
        selectedDate, setSelectedDate,
        dateMode, setDateMode,
        calculateElapsedWorkDays,
        updateUserDefaultLocation,
        // Atomic Saves
        saveBranchSettings, saveRepSettings, saveGlobalConfig, saveHolidays, saveAllBranchSettings,
        // Undo/Redo
        canUndo, canRedo, undoSettings, redoSettings
    };
};
