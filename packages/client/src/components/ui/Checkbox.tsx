import type React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Checkbox(props: Props) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-neutral-300 text-calm-600 focus:ring-calm-500"
      {...props}
    />
  );
}
