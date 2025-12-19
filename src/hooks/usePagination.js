// usePagination.jsx
import { useEffect, useMemo, useRef, useState } from "react";

export function usePagination(items = [], pageSize = 10, options = {}) {
  const { initialPage = 1, resetKeys = [], onPageChange, appendMode = false } = options;

  const [currentPage, setCurrentPage] = useState(
    Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1
  );
  const [loadedItems, setLoadedItems] = useState([]);
  const lastResetKeys = useRef([]);

  const totalItems = items?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));

  useEffect(() => {
    const changed =
      resetKeys.length !== lastResetKeys.current.length ||
      resetKeys.some((v, i) => v !== lastResetKeys.current[i]);

    if (changed) {
      lastResetKeys.current = [...resetKeys];
      setCurrentPage(1);
      if (appendMode) setLoadedItems([]);
      onPageChange?.(1);
      return;
    }

    setCurrentPage((p) => {
      const next = Math.min(Math.max(p, 1), totalPages);
      if (next !== p) onPageChange?.(next);
      return next;
    });
  }, [totalPages, ...resetKeys]);

  const { paginatedData, rangeStart, rangeEnd } = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    const pageSlice = items.slice(start, end);

    if (appendMode) {
      const merged = [...loadedItems, ...pageSlice];
      return {
        paginatedData: merged,
        rangeStart: 1,
        rangeEnd: merged.length,
      };
    }

    return {
      paginatedData: pageSlice,
      rangeStart: totalItems === 0 ? 0 : start + 1,
      rangeEnd: Math.min(end, totalItems),
    };
  }, [items, pageSize, currentPage, totalItems, loadedItems, appendMode]);

  const setPage = (p) => {
    const next = Math.min(Math.max(Number(p) || 1, 1), totalPages);
    setCurrentPage(next);

    if (appendMode && next > 1) {
      const start = (next - 1) * pageSize;
      const end = start + pageSize;
      setLoadedItems((prev) => [...prev, ...items.slice(start, end)]);
    }

    onPageChange?.(next);
  };

  return {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    rangeStart,
    rangeEnd,
    setPage,
    nextPage: () => setPage(currentPage + 1),
    prevPage: () => setPage(currentPage - 1),
  };
}

export default usePagination;
