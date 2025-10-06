import type React from "react";
import { useEffect } from "react";
import Card from "./Card";

export default function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <Card
        className="relative z-10 w-full max-w-md p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="mb-2 font-semibold text-sm">{title}</div>}
        {children}
      </Card>
    </div>
  );
}
