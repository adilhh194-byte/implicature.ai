import React, { useState, useEffect } from 'react';
import { UploadZone } from './components/UploadZone.jsx';
import { AnalyzerControls } from './components/AnalyzerControls.jsx';
import { ReviewTable } from './components/ReviewTable.jsx';
import { ComplaintDashboard } from './components/ComplaintDashboard.jsx';
import { useReviews } from './hooks/useReviews.js';
import { Moon, Sun, Search, Activity, Send, Github } from 'lucide-react';

function App() {
    const {
        rawReviews, enrichedReviews, isAnalyzing, analyzeProgress,
        addReviews, analyze, clearAll
    } = useReviews();

    // Theme state
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const [step, setStep] = useState(1);

    // Apply theme to document element
    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    // Step progression
    useEffect(() => {
        if (enrichedReviews.length > 0) {
            setStep(3);
        } else if (rawReviews.length > 0 && !isAnalyzing) {
            setStep(2);
        } else if (rawReviews.length === 0) {
            setStep(1);
        }
    }, [rawReviews.length, enrichedReviews.length, isAnalyzing]);

    const loadSampleData = async () => {
        try {
            const texts = [
                "Great app but customer service never replied when I had an issue.",
                "I like this product, it works perfectly!",
                "The color is nice however it is quite expensive considering the quality.",
                "Functions alright yet the delivery was late and the box was completely damaged.",
                "Decent build but the software has too many bugs and crashes."
            ];
            const samples = texts.map((t, i) => ({
                id: `s${i + 1}`, review: t
            }));
            await addReviews(samples);
        } catch (e) {
            console.error("Failed to load sample data", e);
        }
    };

    const handleClearAll = async () => {
        await clearAll();
        setStep(1);
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-sky-100 via-slate-50 to-sky-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex flex-col items-center justify-start transition-colors duration-500 ease-out">

            {/* Header Container Area */}
            <div className="w-full flex justify-center px-4 pt-6 pb-2">
                <header className="w-full max-w-6xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl p-2 bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg">
                            <Search className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-400 bg-clip-text text-transparent text-center leading-tight">
                                Implicature AI
                            </h1>
                            <span className="text-[11px] text-slate-500 font-medium hidden sm:block -mt-0.5">
                                Discover hidden complaints in your product
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-full bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-white/10 shadow-md backdrop-blur-xl hover:bg-white/60 dark:hover:bg-slate-900/60 transition duration-300 text-slate-700 dark:text-slate-300"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                </header>
            </div>

            {/* Main Content Wrapper */}
            <main className="flex-1 w-full flex flex-col items-center px-4 py-6">
                <div className="glass-container">

                    {/* Wizard Progress */}
                    <div className="max-w-2xl mx-auto mb-4">
                        <div className="flex items-center justify-between relative">


                            {['Upload Data', 'Analyze', 'Results'].map((label, i) => {
                                const stepNum = i + 1;
                                const isActive = step >= stepNum;
                                const isCurrent = step === stepNum;
                                return (
                                    <div key={label} className="relative z-10 flex flex-col items-center gap-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isActive
                                            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg'
                                            : 'bg-white/60 dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-slate-500'
                                            }`}>
                                            {isActive && !isCurrent ? '✓' : stepNum}
                                        </div>
                                        <span className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${isCurrent ? 'text-cyan-600 dark:text-cyan-400' : isActive ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'
                                            }`}>
                                            {label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* STEP 1: UPLOAD */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="text-center max-w-2xl mx-auto">
                                <h2 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-400 bg-clip-text text-transparent mb-4">
                                    Extract Hidden Complaints
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed mb-6">
                                    Find the silent, implicit complaints hidden inside seemingly positive reviews.
                                    Powered by custom NLP heuristics that run entirely in your browser.
                                </p>
                                <button onClick={loadSampleData} className="ghost-btn gap-2">
                                    <Activity className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                                    Load 5 Demo Reviews
                                </button>
                            </div>
                            <UploadZone onUploadSuccess={addReviews} />
                        </div>
                    )}

                    {/* STEP 2: ANALYZE */}
                    {step === 2 && (
                        <div className="animate-in fade-in duration-500">
                            <AnalyzerControls
                                isAnalyzing={isAnalyzing}
                                analyzeProgress={analyzeProgress}
                                onAnalyze={analyze}
                                totalReviews={rawReviews.length}
                                onClear={handleClearAll}
                            />
                        </div>
                    )}

                    {/* STEP 3: RESULTS */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-500 w-full">
                            <div className="flex justify-start">
                                <button onClick={() => setStep(2)} className="ghost-btn text-xs px-3 py-1.5">
                                    &larr; Back to Analysis Rules
                                </button>
                            </div>
                            <ComplaintDashboard reviews={enrichedReviews} />
                            <ReviewTable reviews={enrichedReviews} theme={theme} />
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full text-center text-xs text-slate-500 dark:text-slate-400 py-6 mt-auto">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6 gap-4 uppercase tracking-wider">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Implicature AI</span>
                    <span>Designed and built by Adi 💙</span>
                    <div className="flex items-center gap-4">
                        <a href="https://t.me/happyadilh" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-cyan-500 transition-colors" title="Telegram">
                            <Send className="h-4 w-4" />
                        </a>
                        <a href="https://github.com/adilhh194-byte" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-cyan-500 transition-colors" title="GitHub">
                            <Github className="h-4 w-4" />
                        </a>
                    </div>
                </div>
            </footer>

        </div>
    );
}

export default App;
