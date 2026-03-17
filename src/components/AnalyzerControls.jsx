import React from 'react';
import { Settings, Play, Database } from 'lucide-react';

export function AnalyzerControls({ isAnalyzing, analyzeProgress, onAnalyze, totalReviews, onClear }) {
    return (
        <div className="glass-card w-full max-w-4xl mx-auto relative overflow-hidden px-5 py-6 md:p-8">
            {isAnalyzing && (
                <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-200 dark:bg-white/5 transition-colors duration-500">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300" style={{ width: `${analyzeProgress}%` }}></div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-500/20 dark:to-blue-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm transition-colors duration-500">
                        <Settings className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white transition-colors duration-500">Analysis Engine</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-500">Configure offline NLP linguistics</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-white/5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md transition-colors duration-500">
                        <Database className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold">{totalReviews} Reviews</span>
                    </div>

                    <button onClick={onClear} disabled={isAnalyzing} className="ghost-btn text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/20 transition-colors">
                        Clear Data
                    </button>

                    <button
                        onClick={() => onAnalyze()}
                        disabled={isAnalyzing || totalReviews === 0}
                        className="accent-btn flex items-center gap-2"
                    >
                        {isAnalyzing ? (
                            <div className="h-4 w-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Play className="h-4 w-4 fill-white flex-shrink-0" />
                        )}
                        {isAnalyzing ? `${analyzeProgress}%` : 'Run Analysis'}
                    </button>
                </div>
            </div>
        </div>
    );
}
