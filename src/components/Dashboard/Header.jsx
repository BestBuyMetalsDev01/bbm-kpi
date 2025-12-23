import React, { useState } from 'react';
import { BarChart3, ChevronDown, Clock, Sun, Moon, Settings, Shield, Eye, EyeOff, User, PieChart, Search, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatBranchName } from '../../utils/formatters';

const Header = ({
    selectedLocation,
    setSelectedLocation,
    locationKeys,
    darkMode,
    setDarkMode,
    setRefreshTrigger,
    viewMode,
    setViewMode,
    userRole,
    toggleAdminMode,
    setShowManagerSettings,
    showManagerSettings,
    selectedDate,
    setSelectedDate,
    dateMode,
    setDateMode
}) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const isKnoxville = selectedLocation === 'Knoxville';
    const themeColor = isKnoxville ? '#FF8200' : '#DE2A24';

    const handleLocationSelect = (loc) => {
        setSelectedLocation(loc);
        setIsOpen(false);
    };

    return (
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6" >
            <div className="flex items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <img
                            src={isKnoxville ? `${import.meta.env.BASE_URL}BBMLOGOVols.png` : `${import.meta.env.BASE_URL}BBMLOGO.png`}
                            alt="BBM Logo"
                            className="h-10 w-auto"
                        />
                        Performance Dashboard
                        <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>

                        {viewMode !== 'comparison' && (
                            <>
                                <div className="relative">
                                    <button
                                        onClick={() => (userRole === 'admin' || userRole === 'executive') && setIsOpen(!isOpen)}
                                        className={`flex items-center gap-2 transition-colors focus:outline-none ${(userRole !== 'admin' && userRole !== 'executive') ? 'cursor-default' : 'hover:opacity-80'}`}
                                        style={{ color: themeColor }}
                                    >
                                        {formatBranchName(selectedLocation)}
                                        {(userRole === 'admin' || userRole === 'executive') && <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
                                    </button>
                                    {isOpen && (
                                        <div className="absolute left-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-2 w-48 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {locationKeys.map(loc => (
                                                <button
                                                    key={loc}
                                                    onClick={() => handleLocationSelect(loc)}
                                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedLocation === loc ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    {formatBranchName(loc)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>
                            </>
                        )}

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="month"
                                className="text-sm font-bold bg-transparent text-slate-700 dark:text-slate-200 outline-none border-none p-0 w-32 cursor-pointer"
                                value={selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}` : ''}
                                onChange={(e) => {
                                    const [y, m] = e.target.value.split('-');
                                    setSelectedDate(new Date(y, m - 1, 1));
                                }}
                            />
                        </div>

                        {viewMode === 'comparison' && (
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1 ml-2 border border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setDateMode('monthly')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest transition-all ${dateMode === 'monthly' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    MONTHLY
                                </button>
                                <button
                                    onClick={() => setDateMode('ytd')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest transition-all ${dateMode === 'ytd' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    YTD
                                </button>
                            </div>
                        )}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        Real-time sales performance tracking and analysis
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">

                {/* User Info Display */}
                <div className="flex items-center gap-3 mr-2">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                            {user?.name || "Guest"}
                        </span>
                        {user?.employeeId && (
                            <span className="text-[10px] uppercase font-mono text-slate-400 font-medium leading-tight">
                                ID: {user.employeeId}
                            </span>
                        )}
                    </div>
                    <div className="relative group">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-md transition-transform group-hover:scale-105 duration-200">
                            {user?.picture ? (
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <User className="w-5 h-5 text-slate-500" />
                                </div>
                            )}
                        </div>
                        {/* Status Indicator */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        title="Toggle Dark Mode"
                    >
                        {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-600" />}
                    </button>

                    <button
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center justify-center"
                        title="Refresh Data"
                    >
                        <Clock className="w-5 h-5 text-blue-500" />
                    </button>

                    <button
                        onClick={() => setShowManagerSettings(!showManagerSettings)}
                        className={`p-2 rounded-lg border transition-colors shadow-sm ${showManagerSettings ? 'bg-purple-600 border-purple-700 text-white shadow-purple-900/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        title="Open Control Center (Rep & Manager)"
                    >
                        <Settings className="w-5 h-5" />
                    </button>





                    {/* View Mode Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsViewOpen(!isViewOpen)}
                            className={`px-4 py-2.5 rounded-xl border transition-all shadow-md flex items-center gap-2.5 ${viewMode === 'comparison' ? 'bg-blue-100 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' :
                                viewMode === 'rep' ? 'bg-purple-100 border-purple-200 text-purple-600 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400' :
                                    viewMode === 'executive' ? 'bg-emerald-100 border-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400' :
                                        viewMode === 'leaderboard' ? 'bg-amber-100 border-amber-200 text-amber-600 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400' :
                                            'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                } cursor-pointer hover:shadow-lg active:scale-95`}
                            title="Switch Dashboard View"
                        >
                            {viewMode === 'comparison' ? <PieChart className="w-6 h-6" /> :
                                viewMode === 'rep' ? <User className="w-6 h-6" /> :
                                    viewMode === 'executive' ? <Search className="w-6 h-6" /> :
                                        viewMode === 'leaderboard' ? <Trophy className="w-6 h-6" /> :
                                            <BarChart3 className="w-6 h-6" />}
                            <span className="text-sm font-black uppercase tracking-widest hidden sm:inline">
                                {viewMode === 'rep' ? 'My Performance' : viewMode === 'comparison' ? 'Company View' : viewMode === 'executive' ? 'Rep Lookup' : viewMode === 'leaderboard' ? 'Leaderboards' : 'Store View'}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isViewOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isViewOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsViewOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                                    <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-800 mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Dashboard View</span>
                                    </div>

                                    <ViewOption
                                        active={viewMode === 'rep'}
                                        onClick={() => { setViewMode('rep'); setIsViewOpen(false); }}
                                        icon={<User className="w-5 h-5" />}
                                        label="My Performance"
                                        description="Your individual sales metrics"
                                        color="text-purple-500"
                                        bgColor="bg-purple-50 dark:bg-purple-900/20"
                                    />
                                    <ViewOption
                                        active={viewMode === 'viewer'}
                                        onClick={() => { setViewMode('viewer'); setIsViewOpen(false); }}
                                        icon={<BarChart3 className="w-5 h-5" />}
                                        label="Store View"
                                        description="Full branch performance table"
                                        color="text-slate-500"
                                        bgColor="bg-slate-50 dark:bg-slate-800"
                                    />
                                    <ViewOption
                                        active={viewMode === 'leaderboard'}
                                        onClick={() => { setViewMode('leaderboard'); setIsViewOpen(false); }}
                                        icon={<Trophy className="w-5 h-5" />}
                                        label="Leaderboards"
                                        description="Top rankings across company"
                                        color="text-amber-500"
                                        bgColor="bg-amber-50 dark:bg-amber-900/20"
                                    />

                                    {(userRole === 'admin' || userRole === 'executive') && (
                                        <>
                                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-4" />
                                            <ViewOption
                                                active={viewMode === 'comparison'}
                                                onClick={() => {
                                                    setViewMode('comparison');
                                                    setSelectedLocation('All');
                                                    setIsViewOpen(false);
                                                }}
                                                icon={<PieChart className="w-5 h-5" />}
                                                label="Company View"
                                                description="Compare all branch locations"
                                                color="text-blue-500"
                                                bgColor="bg-blue-50 dark:bg-blue-900/20"
                                            />
                                            <ViewOption
                                                active={viewMode === 'executive'}
                                                onClick={() => {
                                                    setViewMode('executive');
                                                    setSelectedLocation('All');
                                                    setIsViewOpen(false);
                                                }}
                                                icon={<Search className="w-5 h-5" />}
                                                label="Rep Lookup"
                                                description="Search any salesperson"
                                                color="text-emerald-500"
                                                bgColor="bg-emerald-50 dark:bg-emerald-900/20"
                                            />
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

const ViewOption = ({ active, onClick, icon, label, description, color, bgColor }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-4 py-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group ${active ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
    >
        <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center ${color} shadow-sm group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div className="flex flex-col text-left">
            <span className={`text-sm font-black uppercase tracking-tight ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                {label}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                {description}
            </span>
        </div>
        {active && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
        )}
    </button>
);

export default Header;
