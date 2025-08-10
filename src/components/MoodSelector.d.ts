import { MoodValue } from '../state';
export default function MoodSelector({ value, onChange }: {
    value?: MoodValue;
    onChange: (v: MoodValue) => void;
}): import("react/jsx-runtime").JSX.Element;
