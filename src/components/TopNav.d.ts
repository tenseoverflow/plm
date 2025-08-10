export type TabKey = 'week' | 'quarterly' | 'history' | 'settings';
export default function TopNav({ active, onChange, }: {
    active: TabKey;
    onChange: (key: TabKey) => void;
}): import("react/jsx-runtime").JSX.Element;
