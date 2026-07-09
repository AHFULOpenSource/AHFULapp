import { useState, useCallback, useMemo } from "react";

export function toLocalDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Detect the first day of the week for a locale
// Returns 0 for Sunday, 1 for Monday, etc.
function detectLocaleFirstDayOfWeek(locale) {
    try {
        const loc = new Intl.Locale(locale);
        const firstDay = loc.weekInfo?.firstDay;
        if (firstDay !== undefined) {
            return firstDay % 7;
        }
    } catch (error) {
        // Fallback if locale is invalid or not supported
    }
    return 0;
}

function UseCalendar(date, locale) {
    // State: first day of current displayed month
    const [startOfMonth, setStartOfMonth] = useState(
        new Date(date.getFullYear(), date.getMonth(), 1)
    );

    // Go to next month
    const goNext = useCallback(() => {
        setStartOfMonth((current) =>
            new Date(current.getFullYear(), current.getMonth() + 1, 1)
        );
    }, []);

    // Go to previous month
    const goPrevious = useCallback(() => {
        setStartOfMonth((current) =>
            new Date(current.getFullYear(), current.getMonth() - 1, 1)
        );
    }, []);

    // Calendar data
    const data = useMemo(() => {
        const now = new Date();
        const year = startOfMonth.getFullYear();
        const month = startOfMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Format weekday labels
        const weekDayFormatter = new Intl.DateTimeFormat(locale, {
            weekday: "short",
        });

        let weekdays = Array.from({ length: 7 }, (_, i) => {
            const baseDate = new Date(2021, 7, 1 + i); // arbitrary week
            return weekDayFormatter.format(baseDate);
        });

        // Reorder weekdays based on locale
        const startIndex = detectLocaleFirstDayOfWeek(locale);
        weekdays = weekdays
            .slice(startIndex)
            .concat(weekdays.slice(0, startIndex));

        // Leading empty days
        const firstDayIndex = startOfMonth.getDay();
        const leading = (firstDayIndex - startIndex + 7) % 7;

        const totalCells = leading + daysInMonth;
        const trailing = (7 - (totalCells % 7)) % 7;

        const cells = [];

        // Previous month's trailing days
        for (let i = leading; i > 0; i--) {
            cells.push({
                date: new Date(year, month, 1 - i),
                currentMonth: false,
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            cells.push({
                date: new Date(year, month, day),
                currentMonth: true,
            });
        }

        // Next month's leading days
        for (let i = 1; i <= trailing; i++) {
            const lastDate = cells[cells.length - 1].date;
            const next = new Date(lastDate);
            next.setDate(lastDate.getDate() + 1);

            cells.push({
                date: next,
                currentMonth: false,
            });
        }

        // Check if a date is today
        const isToday = (d) => {
            return (
                d.getFullYear() === now.getFullYear() &&
                d.getMonth() === now.getMonth() &&
                d.getDate() === now.getDate()
            );
        };

        return {
            year,
            month,
            weekdays,
            cells,
            isToday,
        };
    }, [startOfMonth, locale]);

    return {
        startOfMonth,
        goNext,
        goPrevious,
        ...data,
    };
}

export default UseCalendar;