import type { MoodValue } from "@store/index";

export function moodEmoji(m?: MoodValue) {
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
