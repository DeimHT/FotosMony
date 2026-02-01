"use client";

import { useState } from "react";

type Props = {
  title: string;
  items: string[];
};

export function AdminHelpBox({ title, items }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-sm text-white">
            ?
          </span>
          <span className="font-semibold text-blue-900">{title}</span>
        </div>
        <span className="text-blue-600">{open ? "Ocultar" : "Ver ayuda"}</span>
      </button>

      {open && (
        <ul className="mt-3 space-y-2 text-sm text-blue-800">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
