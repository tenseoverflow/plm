import { jsx as _jsx } from "react/jsx-runtime";
export default function Checkbox(props) {
    return (_jsx("input", { type: "checkbox", className: "h-4 w-4 rounded border-neutral-300 text-calm-600 focus:ring-calm-500", ...props }));
}
