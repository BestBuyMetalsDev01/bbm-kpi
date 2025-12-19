import React from 'react';

export const AdminInput = ({ label, value, onChange, prefix }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
        <div className="relative group">
            {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium group-focus-within:text-purple-500 transition-colors uppercase text-[10px]">{prefix}</span>}
            <input
                type="text"
                className={`w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl ${prefix ? 'pl-8' : 'px-4'} py-2.5 text-sm text-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all shadow-sm shadow-slate-100/50 dark:shadow-none`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    </div>
);
