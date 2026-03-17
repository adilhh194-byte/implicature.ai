import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, AlertCircle, ArrowUpDown } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';

const CATEGORY_COLORS = {
    'Price': 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    'Service': 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    'Bug': 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
    'Shipping': 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
    'Quality': 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    'Usability': 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    'Comfort': 'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-500/20',
    'Taste': 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
    'Size/Fit': 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/20',
    'Durability': 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
    'Design': 'bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-500/20',
    'Performance': 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20',
    'Support': 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20',
    'Delivery': 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
    'Other': 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-white/10',
};

export function ReviewTable({ reviews }) {
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [sortCol, setSortCol] = useState(null);
    const [sortAsc, setSortAsc] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    const complaintsOnly = reviews.filter(r => r.has_hidden_complaint);
    const categories = ['All', ...new Set(complaintsOnly.map(r => r.category || 'Other'))];

    const filteredReviews = useMemo(() => {
        let result = complaintsOnly.filter(r => {
            const cat = r.category || 'Other';
            if (filterCategory !== 'All' && cat !== filterCategory) return false;
            if (search) {
                const t = (r.complaint || r.review || r.complaint_text || r.original_text || '').toLowerCase();
                if (!t.includes(search.toLowerCase())) return false;
            }
            return true;
        });

        if (sortCol) {
            result.sort((a, b) => {
                let valA = a[sortCol] || '';
                let valB = b[sortCol] || '';
                // Adjust mapped fields
                if (sortCol === 'review') { valA = a.review || a.original_text || ''; valB = b.review || b.original_text || ''; }
                if (sortCol === 'marker') { valA = a.marker || a.marker_found || ''; valB = b.marker || b.marker_found || ''; }
                if (sortCol === 'complaint') { valA = a.complaint || a.complaint_text || ''; valB = b.complaint || b.complaint_text || ''; }
                if (sortCol === 'category') { valA = a.category || ''; valB = b.category || ''; }

                return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
        }

        return result;
    }, [complaintsOnly, filterCategory, search, sortCol, sortAsc]);

    const handleSort = (col) => {
        if (sortCol === col) {
            setSortAsc(!sortAsc);
        } else {
            setSortCol(col);
            setSortAsc(true);
        }
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const renderHighlight = (text, marker) => {
        if (!marker || !text) return <span className="line-clamp-3 leading-relaxed">{text}</span>;
        const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.split(new RegExp(`\\b(${escaped})\\b`, 'i'));
        return (
            <span className="line-clamp-3 leading-relaxed">
                {parts.map((p, i) => p.toLowerCase() === marker.toLowerCase()
                    ? <mark key={i} className="bg-cyan-200/60 dark:bg-cyan-500/30 text-cyan-900 dark:text-cyan-200 font-bold px-1 rounded">{p}</mark> : p
                )}
            </span>
        );
    };

    const Row = ({ index, style }) => {
        const r = filteredReviews[index];
        const cat = r.category || 'Other';
        const reviewText = r.review || r.original_text || '';
        const markerText = r.marker || r.marker_found || '';
        const complaintText = r.complaint || r.complaint_text || '';

        return (
            <div style={style} className="flex items-start px-5 py-4 border-b border-slate-200 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors duration-200">
                <div className="w-[35%] pr-4 text-sm text-slate-700 dark:text-slate-300 whitespace-normal">
                    {renderHighlight(reviewText, markerText)}
                </div>
                <div className="w-[15%] pr-4">
                    <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 text-center">
                        {markerText}
                    </span>
                </div>
                <div className="w-[30%] pr-4 font-medium text-slate-800 dark:text-slate-200">
                    <div className="bg-white/60 dark:bg-black/20 p-2.5 rounded-lg border border-red-200/50 dark:border-red-500/10 text-sm leading-relaxed whitespace-normal shadow-sm">
                        {complaintText}
                    </div>
                </div>
                <div className="w-[15%] pr-4 pt-2">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other']}`}>
                        {cat}
                    </span>
                </div>
                <div className="w-[5%] flex justify-end items-start pt-1">
                    <button onClick={() => handleCopy(complaintText, r.id)}
                        className="p-2 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors" title="Copy complaint">
                        {copiedId === r.id ? <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        );
    };

    if (reviews.length === 0) return (
        <div className="glass-card-solid p-10 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">No reviews yet</h3>
            <p className="text-sm text-slate-500 mt-2">Upload and analyze to populate this table.</p>
        </div>
    );

    return (
        <div className="glass-card-solid flex flex-col overflow-hidden p-0 w-full transition-colors duration-500">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-4 justify-between bg-white/20 dark:bg-transparent">
                <div className="flex flex-wrap gap-3 flex-1">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input type="text" placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)}
                            className="glass-input pl-9" />
                    </div>

                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                        className="glass-input w-auto min-w-[140px] cursor-pointer">
                        {categories.map(c => (
                            <option key={c} value={c} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{c}</option>
                        ))}
                    </select>
                </div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider self-center bg-white/40 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-white/50 dark:border-white/5">
                    {filteredReviews.length} extracted complaints
                </div>
            </div>

            <div className="flex px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/10">
                <div className="w-[35%] cursor-pointer hover:text-slate-700 flex items-center pr-4" onClick={() => handleSort('review')}>
                    Original Review <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
                <div className="w-[15%] cursor-pointer hover:text-slate-700 flex items-center pr-4" onClick={() => handleSort('marker')}>
                    Detected Marker <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
                <div className="w-[30%] cursor-pointer hover:text-slate-700 flex items-center pr-4" onClick={() => handleSort('complaint')}>
                    Extracted Complaint <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
                <div className="w-[15%] cursor-pointer hover:text-slate-700 flex items-center pr-4" onClick={() => handleSort('category')}>
                    Complaint Category <ArrowUpDown className="ml-1 h-3 w-3" />
                </div>
                <div className="w-[5%] text-right pt-0.5">Act</div>
            </div>

            {filteredReviews.length === 0 ? (
                <div className="py-16 text-center text-slate-500 font-medium text-base">No matching complaints found.</div>
            ) : (
                <List height={600} itemCount={filteredReviews.length} itemSize={140} width="100%">
                    {Row}
                </List>
            )}
        </div>
    );
}
