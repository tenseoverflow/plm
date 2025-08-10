import { MoodValue } from '@store/index';

const moods: { value: MoodValue; label: string; emoji: string }[] = [
    { value: 1, label: 'Low', emoji: '😞' },
    { value: 2, label: 'Down', emoji: '☁️' },
    { value: 3, label: 'Okay', emoji: '🙂' },
    { value: 4, label: 'Good', emoji: '😊' },
    { value: 5, label: 'Great', emoji: '🌞' },
];

export default function MoodSelector({ value, onChange }: { value?: MoodValue; onChange: (v: MoodValue) => void }) {
    return (
        <div className="flex items-center gap-2">
            {moods.map((m) => (
                <button
                    key={m.value}
                    onClick={() => onChange(m.value)}
                    aria-label={m.label}
                    className={`h-10 w-10 rounded-full transition-transform ${value === m.value ? 'bg-calm-500 text-white scale-105' : 'bg-neutral-100 dark:bg-neutral-900'
                        }`}
                >
                    <span className="text-lg" role="img" aria-hidden>
                        {m.emoji}
                    </span>
                </button>
            ))}
        </div>
    );
}
