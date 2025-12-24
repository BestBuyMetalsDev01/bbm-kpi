/**
 * Date and work day utility functions.
 */

/**
 * Calculates total working days in a month (Mon-Fri), excluding holidays.
 */
export const calculateTotalWorkDays = (year, month, holidays = []) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const holidaySet = new Set(holidays.map(h => h.date));
    let workDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay();
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateString)) {
            workDays++;
        }
    }
    return workDays;
};

/**
 * Calculates elapsed working days from the start of the month up to (and including) 
 * the current date or a target date, excluding holidays.
 */
export const calculateElapsedWorkDays = (year, month, holidays = []) => {
    const today = new Date();
    const targetYear = today.getFullYear();
    const targetMonth = today.getMonth();
    const targetDay = today.getDate();

    // If we are looking at a future month/year, elapsed is 0
    if (year > targetYear || (year === targetYear && month > targetMonth)) {
        return 0;
    }

    // If we are looking at a past month/year, elapsed is all work days
    if (year < targetYear || (year === targetYear && month < targetMonth)) {
        return calculateTotalWorkDays(year, month, holidays);
    }

    // Otherwise, calculate up to today
    const holidaySet = new Set(holidays.map(h => h.date));
    let elapsed = 0;
    for (let day = 1; day <= targetDay; day++) {
        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay();
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateString)) {
            elapsed++;
        }
    }
    return elapsed;
};
