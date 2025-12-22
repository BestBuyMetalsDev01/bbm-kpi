import React, { useEffect, useState } from 'react';
import { Trophy, Star, Target } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const GoalVisualizer = ({ current, target, label, icon: Icon, colorClass = "text-blue-500" }) => {
    const [progress, setProgress] = useState(0);
    const safeCurrent = Number.isFinite(Number(current)) ? Number(current) : 0;
    const safeTarget = Number.isFinite(Number(target)) ? Number(target) : 0;

    // Calculate percentage safely
    let percentage = 0;
    if (safeTarget > 0) {
        percentage = (safeCurrent / safeTarget) * 100;
    }
    // Cap at 100 for visual circle, but keep accurate for text if needed? Usually visualizers cap at 100.
    // Actually, user might want to see >100%. But the strokeDashoffset can't handle >100 properly visually (it loops).
    // The text should show real percentage. The circle should cap.

    // For the visual circle (offsets):
    const visualPercentage = Math.min(100, Math.max(0, percentage));

    useEffect(() => {
        // Simple animation effect
        const timer = setTimeout(() => setProgress(visualPercentage), 100);
        return () => clearTimeout(timer);
    }, [visualPercentage]);

    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    const isComplete = safeCurrent >= safeTarget && safeTarget > 0;

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg relative overflow-hidden">
            {isComplete && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
                    {/* Placeholder for fireworks/confetti if we added a library, for now, subtle pulse */}
                    <div className="w-full h-full bg-yellow-500/20 animate-pulse rounded-full blur-3xl"></div>
                </div>
            )}

            <div className="relative w-40 h-40 mb-4">
                {/* SVG Circle */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        className="stroke-slate-100 dark:stroke-slate-800"
                        strokeWidth="12"
                        fill="transparent"
                    />
                    <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        className={`transition-all duration-1000 ease-out ${isComplete ? 'stroke-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : colorClass}`}
                        strokeWidth="12"
                        strokeLinecap="round"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>

                {/* Icon Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {isComplete ? (
                        <Trophy className="w-8 h-8 text-yellow-500 animate-bounce mb-1" />
                    ) : (
                        Icon && <Icon className={`w-8 h-8 ${colorClass} opacity-80 mb-1`} />
                    )}
                    <span className="text-2xl font-black text-slate-800 dark:text-white">
                        {Number.isFinite(percentage) ? percentage.toFixed(0) : '0'}%
                    </span>
                </div>
            </div>

            <div className="text-center z-10 group relative">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</h3>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(safeCurrent)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                        Goal: {formatCurrency(safeTarget)}
                    </span>
                </div>
                {/* DEBUG TOOLTIP */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    Raw Current: {current}<br />
                    Raw Target: {target}<br />
                    Safe Target: {safeTarget}
                </div>
            </div>
        </div>
    );
};

export default GoalVisualizer;
