"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import type { ClientRole } from "@/lib/clientService";
import ClientForm, {
  type ClientFormValues,
  makeDefaultClientFormValues,
  clientFormValuesToCreateBody,
} from "@/components/ClientForm";
import { LookupActions, LookupBox, LookupDropdown, LookupOption, lookupInputClass } from "@/components/LookupFieldParts";

export interface ClientSummary {
  id: string;
  clientId: string;
  name: string;
}

export interface ClientLookupFieldProps {
  label: string;
  role?: ClientRole; // filters autocomplete + search modal to clients with this role flag true
  value: string | null; // currently selected Client.id (Mongo ObjectId string), or null
  onChange: (clientId: string | null, client?: ClientSummary) => void;
  required?: boolean;
  disabled?: boolean;
}

export default function ClientLookupField({ label, role, value, onChange, required, disabled }: ClientLookupFieldProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ClientSummary | null>(null);
  const [suggestions, setSuggestions] = useState<ClientSummary[]>([]);
  // The query the current `suggestions` were fetched for — lets the dropdown tell
  // "no matches" apart from "search still in flight".
  const [searchedQuery, setSearchedQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayText = (c: ClientSummary) => c.name;

  // Resolve the incoming `value` (an id) into a displayable summary, e.g. when editing
  // an existing record. Skips the fetch if we already resolved this exact id.
  useEffect(() => {
    let cancelled = false;
    if (!value) {
      // Clearing the field's display text to match an externally-cleared `value` prop
      // is exactly what this effect syncs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(null);
      setQuery("");
      return;
    }
    if (selected && selected.id === value) return;
    (async () => {
      try {
        const res = await fetch(`/api/clients/${value}`);
        if (!res.ok) return;
        const client = await res.json();
        if (!cancelled) {
          const summary = { id: client.id, clientId: client.clientId, name: client.name };
          setSelected(summary);
          setQuery(displayText(summary));
        }
      } catch {
        // ignore — leave field blank rather than throwing
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced type-ahead search.
  useEffect(() => {
    if (!query.trim() || (selected && query === displayText(selected))) {
      // Clearing stale suggestions when the query is emptied/matches the selection is
      // the state this effect synchronizes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query, limit: "10" });
        if (role) params.set("role", role);
        const res = await fetch(`/api/clients/search?${params.toString()}`);
        if (res.ok) {
          setSuggestions(await res.json());
          setSearchedQuery(query);
        }
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, role, selected]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(client: ClientSummary) {
    setSelected(client);
    setQuery(displayText(client));
    setSuggestions([]);
    setShowSuggestions(false);
    onChange(client.id, client);
  }

  function clear() {
    setSelected(null);
    setQuery("");
    setSuggestions([]);
    onChange(null);
  }

  function openSearch() {
    setShowSuggestions(false);
    setSearchModalOpen(true);
  }

  function openAdd() {
    setShowSuggestions(false);
    setAddModalOpen(true);
  }

  const dropdownOpen =
    showSuggestions && !selected && query.trim() !== "" && (suggestions.length > 0 || searchedQuery === query);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative" ref={containerRef}>
        <LookupBox disabled={disabled}>
          <input
            className={lookupInputClass}
            value={query}
            disabled={disabled}
            placeholder="Search client..."
            title={selected ? `${selected.name} (${selected.clientId})` : undefined}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              if (selected) {
                setSelected(null);
                onChange(null);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowSuggestions(false);
            }}
          />
          <LookupActions
            noun="client"
            showClear={Boolean(value || query)}
            onClear={clear}
            onBrowse={openSearch}
            onAdd={openAdd}
            disabled={disabled}
          />
        </LookupBox>
        {dropdownOpen && (
          <LookupDropdown noun="client" query={query.trim()} empty={suggestions.length === 0} onBrowse={openSearch} onAdd={openAdd}>
            {suggestions.map((c) => (
              <LookupOption key={c.id} onPick={() => pick(c)}>
                {c.name}
              </LookupOption>
            ))}
          </LookupDropdown>
        )}
      </div>

      {searchModalOpen && (
        <ClientSearchModal
          role={role}
          onClose={() => setSearchModalOpen(false)}
          onPick={(c) => {
            pick(c);
            setSearchModalOpen(false);
          }}
        />
      )}

      {addModalOpen && (
        <ClientAddModal
          role={role}
          initialName={selected ? "" : query.trim()}
          onClose={() => setAddModalOpen(false)}
          onCreated={(c) => {
            pick(c);
            setAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ModalShell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-lg bg-white p-5 shadow-xl dark:bg-brand`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ClientSearchModal({
  role,
  onClose,
  onPick,
}: {
  role?: ClientRole;
  onClose: () => void;
  onPick: (client: ClientSummary) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (q) params.set("q", q);
        if (role) params.set("role", role);
        const res = await fetch(`/api/clients/search?${params.toString()}`);
        if (res.ok && !cancelled) setResults(await res.json());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q, role]);

  return (
    <ModalShell title="Search Clients" onClose={onClose} wide>
      <input
        autoFocus
        className="mb-3 w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-brand"
        placeholder="Search by name or client ID..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="max-h-96 overflow-auto rounded border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Client ID</th>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {results.map((c) => (
              <tr key={c.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 font-mono text-xs text-zinc-500">{c.clientId}</td>
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onPick(c)}
                    className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-brand-dark"
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
            {!loading && results.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-zinc-500">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModalShell>
  );
}

function ClientAddModal({
  role,
  initialName,
  onClose,
  onCreated,
}: {
  role?: ClientRole;
  initialName?: string;
  onClose: () => void;
  onCreated: (client: ClientSummary) => void;
}) {
  const [values, setValues] = useState<ClientFormValues>(() => ({ ...makeDefaultClientFormValues(role), name: initialName ?? "" }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientFormValuesToCreateBody(values)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create client");
      }
      const client = await res.json();
      onCreated({ id: client.id, clientId: client.clientId, name: client.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Add New Client" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ClientForm values={values} onChange={setValues} compact disabled={saving} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? "Saving..." : "Create Client"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
