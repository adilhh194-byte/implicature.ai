import { useState, useEffect, useCallback } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'ImplicatureDB';
const DB_VERSION = 1;
const STORE_RAW = 'raw_reviews';
const STORE_ENRICHED = 'enriched_reviews';

const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_RAW)) {
                db.createObjectStore(STORE_RAW, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_ENRICHED)) {
                db.createObjectStore(STORE_ENRICHED, { keyPath: 'id' });
            }
        },
    });
};

export function useReviews() {
    const [rawReviews, setRawReviews] = useState([]);
    const [enrichedReviews, setEnrichedReviews] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzeProgress, setAnalyzeProgress] = useState(0);
    const [db, setDb] = useState(null);

    useEffect(() => {
        initDB().then(database => {
            setDb(database);
            loadFromDB(database);
        });
    }, []);

    const loadFromDB = async (database) => {
        try {
            const raw = await database.getAll(STORE_RAW);
            const enriched = await database.getAll(STORE_ENRICHED);
            setRawReviews(raw || []);
            setEnrichedReviews(enriched || []);
        } catch (err) {
            console.error('Failed to load DB', err);
        }
    };

    const addReviews = async (newReviews) => {
        if (!db) return;
        const tx = db.transaction(STORE_RAW, 'readwrite');
        const store = tx.objectStore(STORE_RAW);

        for (const r of newReviews) {
            await store.put(r);
        }
        await tx.done;

        // Memory pagination: if > 15000, we might want to trim, but IndexedDB handles it.
        // We load all into memory for the virtualized table (react-window handles the DOM).
        await loadFromDB(db);
    };

    const clearAll = async () => {
        if (!db) return;
        try {
            const tx1 = db.transaction(STORE_RAW, 'readwrite');
            await tx1.objectStore(STORE_RAW).clear();
            await tx1.done;

            const tx2 = db.transaction(STORE_ENRICHED, 'readwrite');
            await tx2.objectStore(STORE_ENRICHED).clear();
            await tx2.done;
        } catch (err) {
            console.error('Clear failed', err);
        }

        setRawReviews([]);
        setEnrichedReviews([]);
    };

    const analyze = useCallback((options = {}) => {
        if (rawReviews.length === 0) return;
        setIsAnalyzing(true);
        setAnalyzeProgress(0);

        const worker = new Worker(new URL('../services/analyzer.worker.js', import.meta.url), { type: 'module' });

        worker.postMessage({ reviews: rawReviews, options });

        worker.onmessage = async (e) => {
            const { type, progress, results } = e.data;
            if (type === 'progress') {
                setAnalyzeProgress(progress);
            } else if (type === 'complete') {
                worker.terminate();

                if (db) {
                    const tx = db.transaction(STORE_ENRICHED, 'readwrite');
                    const store = tx.objectStore(STORE_ENRICHED);
                    await store.clear();

                    // Batch put to IndexedDB
                    for (const res of results) {
                        await store.put(res);
                    }
                    await tx.done;
                }

                setEnrichedReviews(results);
                setIsAnalyzing(false);
                setAnalyzeProgress(100);

                // Push notification if analyzing a large dataset took a while and they backgrounded the tab
                if (Notification.permission === "granted" && results.length > 500) {
                    new Notification("Implicature AI", {
                        body: `Analysis complete for ${results.length} reviews!`,
                        icon: "/favicon.ico" // assuming PWA icon exists
                    });
                }
            }
        };
    }, [rawReviews, db]);

    // Request notification permissions
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    return {
        rawReviews,
        enrichedReviews,
        isAnalyzing,
        analyzeProgress,
        addReviews,
        analyze,
        clearAll
    };
}
