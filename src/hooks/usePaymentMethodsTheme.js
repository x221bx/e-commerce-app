import { useMemo } from "react";

export const usePaymentMethodsTheme = (isDark) => {
    return useMemo(
        () => ({
            accentText: isDark ? "text-emerald-300" : "text-emerald-600",
            headingColor: isDark ? "text-white" : "text-slate-900",
            subText: isDark ? "text-slate-400" : "text-slate-500",
            badgeSurface: isDark
                ? "border-emerald-800/40 bg-emerald-900/30 text-emerald-100"
                : "border-emerald-100 bg-emerald-50/60 text-emerald-700",
            panelSurface: isDark
                ? "border-slate-800/80 bg-gradient-to-b from-slate-900/70 to-slate-900/40"
                : "border-slate-100 bg-white/95",
            dashedSurface: isDark
                ? "border-slate-800 text-slate-400"
                : "border-slate-200 text-slate-500",
            cardSurface: isDark
                ? "border-slate-800/70 bg-gradient-to-br from-slate-900/60 to-slate-900/30"
                : "border-slate-100 bg-white/90",
            muted: isDark ? "text-slate-400" : "text-slate-500",
            defaultBadge: isDark
                ? "bg-emerald-900/30 text-emerald-200"
                : "bg-emerald-50 text-emerald-700",
            outlineButton: isDark
                ? "border-slate-700 text-slate-200 hover:bg-slate-800/70"
                : "border-slate-200 text-slate-700 hover:bg-slate-50",
            destructiveButton: isDark
                ? "border-red-900/40 text-red-200 hover:bg-red-900/30"
                : "border-red-200 text-red-600 hover:bg-red-50",
        }),
        [isDark]
    );
};
