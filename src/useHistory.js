import { useState, useCallback } from "react";

const KEYS = {
  searches:  "rr_search_history",
  saved:     "rr_saved_searches",
  alerts:    "rr_alert_history",
};

const read  = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
const write = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} };

export function useHistory() {
  const [searchHistory, setSearchHistory] = useState(() => read(KEYS.searches));
  const [savedSearches, setSavedSearches] = useState(() => read(KEYS.saved));
  const [alertHistory,  setAlertHistory]  = useState(() => read(KEYS.alerts));

  // ── Log a search ──────────────────────────────────────────────────────────
  const logSearch = useCallback((query, category, resultCount) => {
    if (!query.trim()) return;
    setSearchHistory((prev) => {
      // Move to top if already exists
      const filtered = prev.filter(
        (s) => !(s.query.toLowerCase() === query.toLowerCase() && s.category === category)
      );
      const next = [
        { id: Date.now(), query, category, resultCount, timestamp: new Date().toISOString() },
        ...filtered,
      ].slice(0, 50); // keep last 50
      write(KEYS.searches, next);
      return next;
    });
  }, []);

  // ── Save / unsave a search ────────────────────────────────────────────────
  const toggleSaved = useCallback((query, category) => {
    setSavedSearches((prev) => {
      const exists = prev.some(
        (s) => s.query.toLowerCase() === query.toLowerCase() && s.category === category
      );
      const next = exists
        ? prev.filter((s) => !(s.query.toLowerCase() === query.toLowerCase() && s.category === category))
        : [{ id: Date.now(), query, category, timestamp: new Date().toISOString() }, ...prev];
      write(KEYS.saved, next);
      return next;
    });
  }, []);

  const isSaved = useCallback((query, category) => {
    return savedSearches.some(
      (s) => s.query.toLowerCase() === query.toLowerCase() && s.category === category
    );
  }, [savedSearches]);

  // ── Log a viewed recall ───────────────────────────────────────────────────
  const logAlert = useCallback((recall, category) => {
    if (!recall?.product_description) return;
    setAlertHistory((prev) => {
      const next = [
        {
          id:          Date.now(),
          product:     recall.product_description,
          reason:      recall.reason_for_recall,
          firm:        recall.recalling_firm,
          report_date: recall.report_date,
          category,
          timestamp:   new Date().toISOString(),
        },
        ...prev.filter((a) => a.product !== recall.product_description),
      ].slice(0, 100); // keep last 100
      write(KEYS.alerts, next);
      return next;
    });
  }, []);

  // ── Clear everything ──────────────────────────────────────────────────────
  const clearHistory = useCallback(() => {
    write(KEYS.searches, []);
    write(KEYS.alerts, []);
    setSearchHistory([]);
    setAlertHistory([]);
  }, []);

  const clearSaved = useCallback(() => {
    write(KEYS.saved, []);
    setSavedSearches([]);
  }, []);

  return {
    searchHistory,
    savedSearches,
    alertHistory,
    logSearch,
    toggleSaved,
    isSaved,
    logAlert,
    clearHistory,
    clearSaved,
  };
}
