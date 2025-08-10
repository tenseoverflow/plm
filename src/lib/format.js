export function moodEmoji(m) {
    return m === 5
        ? "🌞"
        : m === 4
            ? "😊"
            : m === 3
                ? "🙂"
                : m === 2
                    ? "☁️"
                    : m === 1
                        ? "😞"
                        : "—";
}
