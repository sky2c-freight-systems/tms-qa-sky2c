"use client";

/**
 * Shared presentational pieces for the single-box lookup fields (<ClientLookupField>,
 * <LocationLookupField>): the bordered box with the input and its inline action icons,
 * and the suggestions dropdown with its "Browse all" / "+ Add new" footer.
 */

import type { ReactNode } from "react";

export function LookupBox({ disabled, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <div
      className={`flex items-center rounded-md border border-zinc-300 shadow-sm transition focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-200 dark:border-zinc-700 dark:focus-within:ring-zinc-700 ${
        disabled ? "bg-zinc-100 dark:bg-zinc-800" : "bg-white dark:bg-brand"
      }`}
    >
      <SearchIcon className="pointer-events-none ml-2.5 h-4 w-4 shrink-0 text-zinc-400" />
      {children}
    </div>
  );
}

export const lookupInputClass =
  "min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm placeholder:text-zinc-400 focus:outline-none disabled:cursor-not-allowed";

export function LookupIconButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {children}
    </button>
  );
}

/** Icon group on the right of the box: [clear] | [browse all] [add new]. */
export function LookupActions({
  noun,
  showClear,
  onClear,
  onBrowse,
  onAdd,
  disabled,
}: {
  noun: string;
  showClear: boolean;
  onClear: () => void;
  onBrowse: () => void;
  onAdd: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 pr-1">
      {showClear && !disabled && (
        <LookupIconButton title="Clear" onClick={onClear}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
            <path d="M5 5l10 10M15 5 5 15" />
          </svg>
        </LookupIconButton>
      )}
      <span className="mx-0.5 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
      <LookupIconButton title={`Browse all ${noun}s`} onClick={onBrowse} disabled={disabled}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
          <path d="M4 5h12M4 10h12M4 15h8" />
        </svg>
      </LookupIconButton>
      <LookupIconButton title={`Add new ${noun}`} onClick={onAdd} disabled={disabled}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
          <path d="M10 4v12M4 10h12" />
        </svg>
      </LookupIconButton>
    </div>
  );
}

export function LookupDropdown({
  noun,
  query,
  empty,
  onBrowse,
  onAdd,
  children,
}: {
  noun: string;
  query: string;
  empty: boolean;
  onBrowse: () => void;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-zinc-200 bg-white text-sm shadow-lg dark:border-zinc-700 dark:bg-brand">
      {empty ? (
        <p className="px-3 py-2 text-zinc-500">No matches for “{query}”</p>
      ) : (
        <ul className="max-h-56 overflow-auto py-1">{children}</ul>
      )}
      <div className="flex border-t border-zinc-100 text-xs dark:border-zinc-800">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onAdd}
          className="flex-1 px-3 py-2 text-left font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          + Add “{query}” as new {noun}
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onBrowse}
          className="px-3 py-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          Browse all
        </button>
      </div>
    </div>
  );
}

export function LookupOption({ onPick, children }: { onPick: () => void; children: ReactNode }) {
  return (
    <li>
      <button
        type="button"
        className="block w-full px-3 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
        onClick={onPick}
      >
        {children}
      </button>
    </li>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="9" cy="9" r="6" />
      <path d="M13.5 13.5 18 18" strokeLinecap="round" />
    </svg>
  );
}
