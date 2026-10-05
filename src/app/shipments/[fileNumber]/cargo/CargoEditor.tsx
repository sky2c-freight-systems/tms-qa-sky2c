"use client";

import { useEffect, useState } from "react";
import type { CargoContainerDTO, LookupOption } from "./types";
import ContainerCard from "./ContainerCard";

interface CargoEditorProps {
  fileNumber: string;
  initialContainers: CargoContainerDTO[];
}

export default function CargoEditor({ fileNumber, initialContainers }: CargoEditorProps) {
  const [containers, setContainers] = useState<CargoContainerDTO[]>(initialContainers);
  const [containerTypeOptions, setContainerTypeOptions] = useState<LookupOption[]>([]);
  const [pieceTypeOptions, setPieceTypeOptions] = useState<LookupOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addingContainer, setAddingContainer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadLookups() {
      try {
        const [containerRes, pieceRes] = await Promise.all([
          fetch("/api/lookups?category=CONTAINER_TYPE"),
          fetch("/api/lookups?category=PIECE_TYPE"),
        ]);
        const containerJson = containerRes.ok ? await containerRes.json() : [];
        const pieceJson = pieceRes.ok ? await pieceRes.json() : [];
        if (!cancelled) {
          setContainerTypeOptions(
            (containerJson as { value: string; label: string }[]).map((r) => ({ value: r.value, label: r.label }))
          );
          setPieceTypeOptions(
            (pieceJson as { value: string; label: string }[]).map((r) => ({ value: r.value, label: r.label }))
          );
        }
      } catch {
        // Non-fatal — selects fall back to free-text-only input if lookups fail to load.
      }
    }
    loadLookups();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    const res = await fetch(`/api/shipments/${fileNumber}/cargo`);
    if (res.ok) {
      const json = await res.json();
      setContainers(json.data as CargoContainerDTO[]);
    }
  }

  async function handleAddContainer() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shipments/${fileNumber}/cargo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to add container");
      }
      await refresh();
      setAddingContainer(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add container");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateContainer(id: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cargo-containers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save container");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save container");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteContainer(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cargo-containers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete container");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete container");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleAddItem(containerId: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cargo-containers/${containerId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to add item");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateItem(id: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cargo-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save item");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteItem(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cargo-items/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete item");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={handleAddContainer}
          disabled={busy || addingContainer}
          className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          + Add Container
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {containers.map((container) => (
          <ContainerCard
            key={container.id}
            container={container}
            containerTypeOptions={containerTypeOptions}
            pieceTypeOptions={pieceTypeOptions}
            busy={busy}
            onUpdateContainer={handleUpdateContainer}
            onDeleteContainer={handleDeleteContainer}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        ))}
        {containers.length === 0 && (
          <div className="rounded border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No containers yet. Click &ldquo;+ Add Container&rdquo; to get started.
          </div>
        )}
      </div>
    </div>
  );
}
