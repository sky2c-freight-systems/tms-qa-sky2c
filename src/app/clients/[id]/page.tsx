"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import ClientForm, {
  EMPTY_CLIENT_FORM_VALUES,
  clientToFormValues,
  clientFormValuesToCreateBody,
  clientFormValuesToPatchBody,
  type ClientFormValues,
} from "@/components/ClientForm";

interface LookupOption {
  value: string;
  label: string;
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";

  const [values, setValues] = useState<ClientFormValues>({ ...EMPTY_CLIENT_FORM_VALUES });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [clientTypeOptions, setClientTypeOptions] = useState<LookupOption[]>([]);
  const [clientIdLabel, setClientIdLabel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lookups?category=CLIENT_TYPE")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: Array<{ value: string; label: string }>) => setClientTypeOptions(rows.map((r) => ({ value: r.value, label: r.label }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/clients/${params.id}`);
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load client");
        const client = await res.json();
        if (!cancelled) {
          setValues(clientToFormValues(client));
          setClientIdLabel(client.clientId);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load client");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, params.id]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
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
        router.push(`/clients/${client.id}`);
      } else {
        const res = await fetch(`/api/clients/${params.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientFormValuesToPatchBody(values)),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to save client");
        }
        const client = await res.json();
        setValues(clientToFormValues(client));
        setClientIdLabel(client.clientId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save client");
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-zinc-500">Client not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isNew ? "New Client" : "Edit Client"}</h1>
        {clientIdLabel && <span className="font-mono text-xs text-zinc-500">{clientIdLabel}</span>}
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <Spinner className="h-4 w-4 text-brand" />
          Loading...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <ClientForm values={values} onChange={setValues} disabled={saving} clientTypeOptions={clientTypeOptions} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => router.push("/clients")}
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
              {saving ? "Saving..." : isNew ? "Create Client" : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
