export function todayString(date = new Date()) {
    return date.toISOString().slice(0, 10);
}
export function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
export function startOfWeekString(date) {
    return todayString(startOfWeek(date));
}
export function quarterKey(date) {
    const y = date.getFullYear();
    const q = Math.floor(date.getMonth() / 3) + 1;
    return `${y}-Q${q}`;
}
