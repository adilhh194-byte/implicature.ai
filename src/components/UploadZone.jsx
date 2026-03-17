import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import { parseFile } from '../services/fileParser';

export function UploadZone({ onUploadSuccess }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const onDrop = useCallback(async (acceptedFiles) => {
        setError(null);
        if (acceptedFiles.length === 0) return;
        setIsProcessing(true);
        try {
            let allReviews = [];
            for (const file of acceptedFiles) {
                const parsed = await parseFile(file);
                allReviews = [...allReviews, ...parsed.reviews];
            }
            if (allReviews.length === 0) throw new Error('No readable text found in those files.');
            onUploadSuccess(allReviews);
        } catch (err) {
            setError(err.message || 'Error processing file.');
        } finally {
            setIsProcessing(false);
        }
    }, [onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/plain': ['.txt'],
            'application/json': ['.json'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        }
    });

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div
                {...getRootProps()}
                className={`glass-card relative overflow-hidden border-2 border-dashed text-center cursor-pointer p-12 transition-all duration-300 ${isDragActive
                    ? 'border-cyan-400/60 bg-white/40 dark:bg-slate-900/60 scale-[1.02]'
                    : 'border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30 hover:bg-white/50 dark:hover:bg-slate-900/50'
                    }`}
            >
                <input {...getInputProps()} />
                {isProcessing ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-16 w-16 text-cyan-500 animate-spin mb-4" />
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Parsing Documents...</p>
                        <div className="w-40 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-4 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-[progress_1.5s_ease-in-out_infinite] origin-left"></div>
                        </div>
                    </div>
                ) : (
                    <div className={`transition-transform duration-200 ${isDragActive ? 'scale-105' : ''}`}>
                        <UploadCloud className={`mx-auto h-16 w-16 mb-4 ${isDragActive ? 'text-cyan-500' : 'text-slate-400 dark:text-slate-500'}`} />
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
                            {isDragActive ? 'Drop to Upload' : 'Drag & Drop Review Data'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">CSV, XLSX, TXT, JSON, DOCX, Images (OCR)</p>
                    </div>
                )}
            </div>
            {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-3 backdrop-blur-md">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}
        </div>
    );
}
