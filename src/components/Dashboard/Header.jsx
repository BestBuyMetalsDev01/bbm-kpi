import React, { useState } from 'react';
import { BarChart3, ChevronDown, Clock, Sun, Moon, Settings, Shield, Eye, EyeOff } from 'lucide-react';

const Header = ({
    selectedLocation,
    setSelectedLocation,
    locationKeys,
    darkMode,
    setDarkMode,
    setRefreshTrigger,
    viewMode,
    toggleAdminMode,
    setShowManagerSettings,
    showManagerSettings
}) => {
    const [isOpen, setIsOpen] = useState(false);
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

                        <div className="relative">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="flex items-center gap-2 hover:opacity-80 transition-colors focus:outline-none"
                                style={{ color: themeColor }}
                            >
                                {selectedLocation === 'All' ? 'All Locations' : selectedLocation}
                                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpen && (
                                <div className="absolute left-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-2 w-48 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {locationKeys.map(loc => (
                                        <button
                                            key={loc}
                                            onClick={() => handleLocationSelect(loc)}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedLocation === loc ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            {loc}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        Real-time sales performance tracking and analysis
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">


                <div className="flex items-center gap-2 ml-2 pl-4 border-l border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        title="Toggle Dark Mode"
                    >
                        {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-600" />}
                    </button>

                    <button
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2"
                        title="Refresh Data"
                    >
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>
        </div >
    );
};

export default Header;
