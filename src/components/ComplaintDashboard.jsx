import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Papa from 'papaparse';
import * as xlsx from 'xlsx';
import { Download, AlertTriangle, Target, Search, BarChart3, TrendingUp, Printer, FileSpreadsheet } from 'lucide-react';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export function ComplaintDashboard({ reviews }) {
    const barRef1 = useRef();
    const barRef2 = useRef();

    useEffect(() => {
        if (reviews.some(r => r.has_hidden_complaint)) {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#22d3ee', '#3b82f6', '#10b981', '#f59e0b'] });
        }
    }, [reviews]);

    if (!reviews || reviews.length === 0) return null;

    const hiddenComplaints = reviews.filter(r => r.has_hidden_complaint);
    if (hiddenComplaints.length === 0) return (
        <div className="glass-card-solid p-8 text-center max-w-3xl mx-auto border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10">
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">Clean Dataset!</h3>
            <p className="text-emerald-700/80 dark:text-emerald-400/80 font-medium">No hidden complaints detected.</p>
        </div>
    );

    const total = reviews.length;
    const hiddenCount = hiddenComplaints.length;
    const pivotRatio = ((hiddenCount / total) * 100).toFixed(1);

    const catCounts = hiddenComplaints.reduce((acc, r) => { const c = r.category || 'Other'; acc[c] = (acc[c] || 0) + 1; return acc; }, {});
    const sortedCategories = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'None';

    const midpoint = Math.ceil(sortedCategories.length / 2);
    const chartGroup1 = sortedCategories.slice(0, midpoint);
    const chartGroup2 = sortedCategories.length > 7 ? sortedCategories.slice(midpoint) : null;

    const barColors = ['#22d3ee', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#f97316', '#14b8a6', '#a855f7', '#06b6d4', '#84cc16'];

    const makeBarData = (cats) => ({
        labels: cats.map(c => c[0]),
        datasets: [{
            label: 'Complaints',
            data: cats.map(c => c[1]),
            backgroundColor: cats.map((_, i) => barColors[i % barColors.length]),
            borderRadius: 6,
        }]
    });

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    const barOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, precision: 0 } },
            x: { grid: { display: false }, ticks: { color: textColor } }
        }
    };

    const formatRow = (r) => ({
        'Original Review': r.review || r.original_text || '',
        'Detected Marker': r.marker || r.marker_found || '',
        'Extracted Complaint': r.complaint || r.complaint_text || '',
        'Complaint Category': r.category || 'Other'
    });

    // PDF Export
    const handleExportPDF = async () => {
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        let pg = 1;

        const footer = () => { pdf.setFontSize(8); pdf.setTextColor(150); pdf.text(`Implicature AI Report  -  Page ${pg}`, pw / 2, ph - 5, { align: 'center' }); pg++; };

        pdf.setFontSize(20); pdf.setTextColor(30, 58, 138);
        pdf.text('Implicature AI - NLP Analysis Report', 15, 18);
        pdf.setFontSize(10); pdf.setTextColor(100);
        pdf.text(`Total Reviews: ${total}  |  Complaints: ${hiddenCount}  |  Pivot Ratio: ${pivotRatio}%  |  Top Category: ${topCategory}`, 15, 27);

        try {
            const c1 = barRef1.current?.canvas;
            if (c1) {
                const img1 = c1.toDataURL('image/png');
                if (chartGroup2) {
                    pdf.addImage(img1, 'PNG', 10, 35, (pw / 2) - 15, 120);
                    const c2 = barRef2.current?.canvas;
                    if (c2) {
                        const img2 = c2.toDataURL('image/png');
                        pdf.addImage(img2, 'PNG', (pw / 2) + 5, 35, (pw / 2) - 15, 120);
                    }
                } else {
                    pdf.addImage(img1, 'PNG', 30, 35, pw - 60, 130);
                }
            }
        } catch (e) { console.warn('Chart export failed:', e); }
        footer();

        const cols = [110, 30, 90, 30]; // Layout: Review, Marker, Complaint, Category
        const sx = 10;
        const rpp = 15;
        const reportRows = hiddenComplaints.map(formatRow);

        for (let i = 0; i < reportRows.length; i += rpp) {
            pdf.addPage('a4', 'l');
            let y = 15;
            pdf.setFontSize(9); pdf.setTextColor(255); pdf.setFillColor(59, 130, 246);
            pdf.rect(sx, y, cols[0] + cols[1] + cols[2] + cols[3], 8, 'F');
            pdf.text('Original Review', sx + 2, y + 6);
            pdf.text('Marker', sx + cols[0] + 2, y + 6);
            pdf.text('Extracted Complaint', sx + cols[0] + cols[1] + 2, y + 6);
            pdf.text('Category', sx + cols[0] + cols[1] + cols[2] + 2, y + 6);
            y += 10; pdf.setTextColor(60); pdf.setFontSize(8);
            reportRows.slice(i, i + rpp).forEach((row, idx) => {
                if (idx % 2 === 0) { pdf.setFillColor(240, 243, 248); pdf.rect(sx, y - 1, cols[0] + cols[1] + cols[2] + cols[3], 9, 'F'); }
                pdf.text((row['Original Review'] || '').substring(0, 80) + '...', sx + 2, y + 5);
                pdf.text((row['Detected Marker'] || '').substring(0, 20), sx + cols[0] + 2, y + 5);
                pdf.text((row['Extracted Complaint'] || '').substring(0, 70), sx + cols[0] + cols[1] + 2, y + 5);
                pdf.text((row['Complaint Category'] || 'Other').substring(0, 20), sx + cols[0] + cols[1] + cols[2] + 2, y + 5);
                y += 9;
            });
            footer();
        }
        pdf.save('implicature-report.pdf');
    };

    const handleExportXLSX = () => {
        const wb = xlsx.utils.book_new();
        const reportData = hiddenComplaints.map(formatRow);
        const ws1 = xlsx.utils.json_to_sheet(reportData);
        ws1['!cols'] = [{ wch: 60 }, { wch: 15 }, { wch: 50 }, { wch: 15 }];
        xlsx.utils.book_append_sheet(wb, ws1, 'Complaints');
        const ws2 = xlsx.utils.json_to_sheet([
            { Metric: 'Total Reviews', Value: total }, { Metric: 'Complaints', Value: hiddenCount },
            { Metric: 'Pivot Ratio', Value: `${pivotRatio}%` },
            { Metric: 'Top Category', Value: topCategory }, { Metric: '', Value: '' },
            ...sortedCategories.map(([c, n]) => ({ Metric: c, Value: n }))
        ]);
        xlsx.utils.book_append_sheet(wb, ws2, 'Summary');
        xlsx.writeFile(wb, 'implicature-results.xlsx');
    };

    const handleExportCSV = () => {
        const reportData = hiddenComplaints.map(formatRow);
        const csv = Papa.unparse(reportData);
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'implicature-results.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const statCards = [
        { icon: AlertTriangle, label: 'Hidden Total', value: hiddenCount, sub: `/ ${total}`, color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20' },
        { icon: Search, label: 'Pivot Ratio', value: `${pivotRatio}%`, color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20' },
        { icon: TrendingUp, label: 'Top Category', value: topCategory, color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20' },
    ];

    return (
        <div className="space-y-6 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-cyan-500" /> Analysis Dashboard
                </h2>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={handleExportPDF} className="ghost-btn !px-3 font-semibold">
                        <Printer className="h-4 w-4 mr-2" /> PDF Report
                    </button>
                    <button onClick={handleExportXLSX} className="ghost-btn !px-3 font-semibold">
                        <FileSpreadsheet className="h-4 w-4 mr-2" /> XLSX
                    </button>
                    <button onClick={handleExportCSV} className="ghost-btn !px-3 font-semibold">
                        <Download className="h-4 w-4 mr-2" /> CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {statCards.map(({ icon: Icon, label, value, sub, color }) => (
                    <div key={label} className="glass-card flex flex-col justify-center">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className={`p-2 rounded-xl shadow-inner ${color}`}><Icon className="h-4 w-4" /></div>
                            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5 pl-1">
                            <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</span>
                            {sub && <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{sub}</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className={`grid ${chartGroup2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-5`}>
                <div className="glass-card-solid p-6 flex flex-col border border-white/60 dark:border-white/10">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-6 uppercase tracking-wide">Complaints by Category</h3>
                    <div className="h-[240px] flex-1 bg-white/40 dark:bg-black/20 p-4 rounded-xl shadow-inner border border-white/40 dark:border-white/5">
                        <Bar ref={barRef1} data={makeBarData(chartGroup1)} options={barOptions} />
                    </div>
                </div>

                {chartGroup2 && (
                    <div className="glass-card-solid p-6 flex flex-col border border-white/60 dark:border-white/10">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-6 uppercase tracking-wide">More Categories</h3>
                        <div className="h-[240px] flex-1 bg-white/40 dark:bg-black/20 p-4 rounded-xl shadow-inner border border-white/40 dark:border-white/5">
                            <Bar ref={barRef2} data={makeBarData(chartGroup2)} options={barOptions} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
