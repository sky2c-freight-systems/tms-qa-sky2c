"use client";

import { useState } from "react";
import { centsToDollars } from "@/lib/money";
import type { CargoContainerDTO, CargoItemDTO, LookupOption } from "./types";

interface ContainerCardProps {
  container: CargoContainerDTO;
  containerTypeOptions: LookupOption[];
  pieceTypeOptions: LookupOption[];
  busy: boolean;
  onUpdateContainer: (id: string, payload: Record<string, unknown>) => Promise<void>;
  onDeleteContainer: (id: string) => Promise<void>;
  onAddItem: (containerId: string, payload: Record<string, unknown>) => Promise<void>;
  onUpdateItem: (id: string, payload: Record<string, unknown>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

type ContainerForm = {
  containerNumber: string;
  containerType: string;
  seal1: string;
  seal2: string;
  seal3: string;
  tareWeightLbs: string;
  tareWeightKgs: string;
  grossWeightLbs: string;
  grossWeightKgs: string;
  vgmWeight: string;
};

type ItemForm = {
  description: string;
  numberOfPieces: string;
  pieceType: string;
  grossWeightLbs: string;
  grossWeightKgs: string;
  grossSizeCft: string;
  grossSizeCbm: string;
  declaredValue: string;
  isVehicle: boolean;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTitle: string;
  vehicleState: string;
};

const EMPTY_ITEM_FORM: ItemForm = {
  description: "",
  numberOfPieces: "",
  pieceType: "",
  grossWeightLbs: "",
  grossWeightKgs: "",
  grossSizeCft: "",
  grossSizeCbm: "",
  declaredValue: "",
  isVehicle: false,
  vehicleMake: "",
  vehicleModel: "",
  vehicleTitle: "",
  vehicleState: "",
};

function numOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
}

function containerToForm(c: CargoContainerDTO): ContainerForm {
  return {
    containerNumber: c.containerNumber ?? "",
    containerType: c.containerType ?? "",
    seal1: c.seal1 ?? "",
    seal2: c.seal2 ?? "",
    seal3: c.seal3 ?? "",
    tareWeightLbs: c.tareWeightLbs?.toString() ?? "",
    tareWeightKgs: c.tareWeightKgs?.toString() ?? "",
    grossWeightLbs: c.grossWeightLbs?.toString() ?? "",
    grossWeightKgs: c.grossWeightKgs?.toString() ?? "",
    vgmWeight: c.vgmWeight?.toString() ?? "",
  };
}

function containerFormToPayload(f: ContainerForm) {
  return {
    containerNumber: f.containerNumber.trim() || null,
    containerType: f.containerType.trim() || null,
    seal1: f.seal1.trim() || null,
    seal2: f.seal2.trim() || null,
    seal3: f.seal3.trim() || null,
    tareWeightLbs: numOrNull(f.tareWeightLbs),
    tareWeightKgs: numOrNull(f.tareWeightKgs),
    grossWeightLbs: numOrNull(f.grossWeightLbs),
    grossWeightKgs: numOrNull(f.grossWeightKgs),
    vgmWeight: numOrNull(f.vgmWeight),
  };
}

function itemToForm(i: CargoItemDTO): ItemForm {
  return {
    description: i.description ?? "",
    numberOfPieces: i.numberOfPieces?.toString() ?? "",
    pieceType: i.pieceType ?? "",
    grossWeightLbs: i.grossWeightLbs?.toString() ?? "",
    grossWeightKgs: i.grossWeightKgs?.toString() ?? "",
    grossSizeCft: i.grossSizeCft?.toString() ?? "",
    grossSizeCbm: i.grossSizeCbm?.toString() ?? "",
    declaredValue: centsToDollars(i.declaredValueCents)?.toString() ?? "",
    isVehicle: i.isVehicle,
    vehicleMake: i.vehicleMake ?? "",
    vehicleModel: i.vehicleModel ?? "",
    vehicleTitle: i.vehicleTitle ?? "",
    vehicleState: i.vehicleState ?? "",
  };
}

function itemFormToPayload(f: ItemForm) {
  return {
    description: f.description.trim() || null,
    numberOfPieces: (() => {
      if (f.numberOfPieces.trim() === "") return null;
      const n = parseInt(f.numberOfPieces, 10);
      return Number.isNaN(n) ? null : n;
    })(),
    pieceType: f.pieceType.trim() || null,
    grossWeightLbs: numOrNull(f.grossWeightLbs),
    grossWeightKgs: numOrNull(f.grossWeightKgs),
    grossSizeCft: numOrNull(f.grossSizeCft),
    grossSizeCbm: numOrNull(f.grossSizeCbm),
    declaredValue: f.declaredValue.trim() || null,
    isVehicle: f.isVehicle,
    vehicleMake: f.isVehicle ? f.vehicleMake.trim() || null : null,
    vehicleModel: f.isVehicle ? f.vehicleModel.trim() || null : null,
    vehicleTitle: f.isVehicle ? f.vehicleTitle.trim() || null : null,
    vehicleState: f.isVehicle ? f.vehicleState.trim() || null : null,
  };
}

const inputClass =
  "w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-brand";
const labelClass = "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";
const btnClass = "rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";
const btnPrimaryClass = "rounded bg-brand px-2 py-1 text-xs text-white hover:bg-brand-dark disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900";
const btnDangerClass = "rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950";

/** Combines a lookup's option list with the record's currently-stored value, in case that
 * value isn't (or is no longer) among the active lookup rows — these fields are free text
 * scalars, not enforced FKs, so we must not silently drop an existing value from the <select>. */
function optionsWithCurrent(options: LookupOption[], current: string): LookupOption[] {
  if (!current || options.some((o) => o.value === current)) return options;
  return [{ value: current, label: current }, ...options];
}

function LookupSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: LookupOption[];
  disabled?: boolean;
}) {
  const all = optionsWithCurrent(options, value);
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="">-- Select --</option>
      {all.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function ContainerCard({
  container,
  containerTypeOptions,
  pieceTypeOptions,
  busy,
  onUpdateContainer,
  onDeleteContainer,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: ContainerCardProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ContainerForm>(() => containerToForm(container));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [addingItem, setAddingItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState<ItemForm>(EMPTY_ITEM_FORM);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM_FORM);

  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState<string | null>(null);

  function startEdit() {
    setForm(containerToForm(container));
    setEditing(true);
    setConfirmDelete(false);
  }

  async function saveEdit() {
    try {
      await onUpdateContainer(container.id, containerFormToPayload(form));
      setEditing(false);
    } catch {
      // error surfaced by parent
    }
  }

  async function confirmDeleteNow() {
    try {
      await onDeleteContainer(container.id);
    } catch {
      // error surfaced by parent
    }
  }

  function startAddItem() {
    setNewItemForm(EMPTY_ITEM_FORM);
    setAddingItem(true);
  }

  async function saveNewItem() {
    try {
      await onAddItem(container.id, itemFormToPayload(newItemForm));
      setAddingItem(false);
      setNewItemForm(EMPTY_ITEM_FORM);
    } catch {
      // error surfaced by parent
    }
  }

  function startEditItem(item: CargoItemDTO) {
    setItemForm(itemToForm(item));
    setEditingItemId(item.id);
    setConfirmDeleteItemId(null);
  }

  async function saveEditItem(itemId: string) {
    try {
      await onUpdateItem(itemId, itemFormToPayload(itemForm));
      setEditingItemId(null);
    } catch {
      // error surfaced by parent
    }
  }

  async function confirmDeleteItemNow(itemId: string) {
    try {
      await onDeleteItem(itemId);
      setConfirmDeleteItemId(null);
    } catch {
      // error surfaced by parent
    }
  }

  return (
    <div className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
      {/* Container header / fields */}
      {editing ? (
        <div>
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelClass}>Container #</label>
              <input
                className={inputClass}
                value={form.containerNumber}
                onChange={(e) => setForm({ ...form, containerNumber: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Container Type</label>
              <LookupSelect
                value={form.containerType}
                onChange={(v) => setForm({ ...form, containerType: v })}
                options={containerTypeOptions}
              />
            </div>
            <div>
              <label className={labelClass}>Seal 1</label>
              <input className={inputClass} value={form.seal1} onChange={(e) => setForm({ ...form, seal1: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Seal 2</label>
              <input className={inputClass} value={form.seal2} onChange={(e) => setForm({ ...form, seal2: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Seal 3</label>
              <input className={inputClass} value={form.seal3} onChange={(e) => setForm({ ...form, seal3: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Tare Wt (lbs)</label>
              <input type="number" className={inputClass} value={form.tareWeightLbs} onChange={(e) => setForm({ ...form, tareWeightLbs: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Tare Wt (kgs)</label>
              <input type="number" className={inputClass} value={form.tareWeightKgs} onChange={(e) => setForm({ ...form, tareWeightKgs: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Gross Wt (lbs)</label>
              <input type="number" className={inputClass} value={form.grossWeightLbs} onChange={(e) => setForm({ ...form, grossWeightLbs: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Gross Wt (kgs)</label>
              <input type="number" className={inputClass} value={form.grossWeightKgs} onChange={(e) => setForm({ ...form, grossWeightKgs: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>VGM Weight</label>
              <input type="number" className={inputClass} value={form.vgmWeight} onChange={(e) => setForm({ ...form, vgmWeight: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className={btnPrimaryClass} disabled={busy} onClick={saveEdit}>
              Save
            </button>
            <button type="button" className={btnClass} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
            <div>
              <span className="text-zinc-500">Container #: </span>
              {container.containerNumber || <span className="text-zinc-400">—</span>}
            </div>
            <div>
              <span className="text-zinc-500">Type: </span>
              {container.containerType || <span className="text-zinc-400">—</span>}
            </div>
            <div>
              <span className="text-zinc-500">Seals: </span>
              {[container.seal1, container.seal2, container.seal3].filter(Boolean).join(", ") || (
                <span className="text-zinc-400">—</span>
              )}
            </div>
            <div>
              <span className="text-zinc-500">Tare: </span>
              {container.tareWeightLbs ?? "—"} lbs / {container.tareWeightKgs ?? "—"} kgs
            </div>
            <div>
              <span className="text-zinc-500">Gross: </span>
              {container.grossWeightLbs ?? "—"} lbs / {container.grossWeightKgs ?? "—"} kgs
            </div>
            <div>
              <span className="text-zinc-500">VGM: </span>
              {container.vgmWeight ?? "—"}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className={btnClass} onClick={startEdit}>
              Edit
            </button>
            <button type="button" className={btnDangerClass} onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="mt-3 flex items-center justify-between rounded border border-red-300 bg-red-50 px-3 py-2 text-sm dark:border-red-900 dark:bg-red-950">
          <span className="text-red-700 dark:text-red-400">
            Delete this container?
            {container.items.length > 0
              ? ` This will also delete ${container.items.length} item(s).`
              : ""}
          </span>
          <div className="flex gap-2">
            <button type="button" className={btnDangerClass} disabled={busy} onClick={confirmDeleteNow}>
              Confirm Delete
            </button>
            <button type="button" className={btnClass} onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Items ({container.items.length})</h3>
          <button type="button" className={btnClass} disabled={busy || addingItem} onClick={startAddItem}>
            + Add Item
          </button>
        </div>

        <div className="overflow-auto rounded border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">Description</th>
                <th className="px-2 py-1.5 text-left font-medium"># Pcs</th>
                <th className="px-2 py-1.5 text-left font-medium">Type</th>
                <th className="px-2 py-1.5 text-left font-medium">Weight</th>
                <th className="px-2 py-1.5 text-left font-medium">Size</th>
                <th className="px-2 py-1.5 text-left font-medium">Declared Value</th>
                <th className="px-2 py-1.5 text-left font-medium">Vehicle</th>
                <th className="px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {container.items.map((item) =>
                editingItemId === item.id ? (
                  <ItemFormRow
                    key={item.id}
                    form={itemForm}
                    setForm={setItemForm}
                    pieceTypeOptions={pieceTypeOptions}
                    busy={busy}
                    onSave={() => saveEditItem(item.id)}
                    onCancel={() => setEditingItemId(null)}
                  />
                ) : (
                  <tr key={item.id} className="border-t border-zinc-100 align-top dark:border-zinc-800">
                    <td className="px-2 py-1.5">{item.description || <span className="text-zinc-400">—</span>}</td>
                    <td className="px-2 py-1.5">{item.numberOfPieces ?? "—"}</td>
                    <td className="px-2 py-1.5">{item.pieceType || <span className="text-zinc-400">—</span>}</td>
                    <td className="px-2 py-1.5">
                      {item.grossWeightLbs ?? "—"} lbs / {item.grossWeightKgs ?? "—"} kgs
                    </td>
                    <td className="px-2 py-1.5">
                      {item.grossSizeCft ?? "—"} cft / {item.grossSizeCbm ?? "—"} cbm
                    </td>
                    <td className="px-2 py-1.5">
                      {item.declaredValueCents != null ? `$${centsToDollars(item.declaredValueCents)?.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-2 py-1.5">
                      {item.isVehicle ? (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] dark:bg-zinc-800">
                          {[item.vehicleMake, item.vehicleModel].filter(Boolean).join(" ") || "Vehicle"}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right">
                      {confirmDeleteItemId === item.id ? (
                        <span className="flex items-center justify-end gap-1.5">
                          <span className="text-xs text-red-700 dark:text-red-400">Delete?</span>
                          <button type="button" className={btnDangerClass} disabled={busy} onClick={() => confirmDeleteItemNow(item.id)}>
                            Yes
                          </button>
                          <button type="button" className={btnClass} onClick={() => setConfirmDeleteItemId(null)}>
                            No
                          </button>
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-1.5">
                          <button type="button" className={btnClass} onClick={() => startEditItem(item)}>
                            Edit
                          </button>
                          <button type="button" className={btnDangerClass} onClick={() => setConfirmDeleteItemId(item.id)}>
                            Delete
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              )}
              {addingItem && (
                <ItemFormRow
                  form={newItemForm}
                  setForm={setNewItemForm}
                  pieceTypeOptions={pieceTypeOptions}
                  busy={busy}
                  onSave={saveNewItem}
                  onCancel={() => setAddingItem(false)}
                />
              )}
              {container.items.length === 0 && !addingItem && (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center text-zinc-500">
                    No items in this container yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ItemFormRow({
  form,
  setForm,
  pieceTypeOptions,
  busy,
  onSave,
  onCancel,
}: {
  form: ItemForm;
  setForm: (f: ItemForm) => void;
  pieceTypeOptions: LookupOption[];
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <tr className="border-t border-zinc-100 bg-zinc-50/50 align-top dark:border-zinc-800 dark:bg-brand/40">
      <td colSpan={8} className="p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2">
            <label className={labelClass}>Description</label>
            <input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}># Pieces</label>
            <input type="number" className={inputClass} value={form.numberOfPieces} onChange={(e) => setForm({ ...form, numberOfPieces: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Piece Type</label>
            <LookupSelect value={form.pieceType} onChange={(v) => setForm({ ...form, pieceType: v })} options={pieceTypeOptions} />
          </div>
          <div>
            <label className={labelClass}>Weight (lbs)</label>
            <input type="number" className={inputClass} value={form.grossWeightLbs} onChange={(e) => setForm({ ...form, grossWeightLbs: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Weight (kgs)</label>
            <input type="number" className={inputClass} value={form.grossWeightKgs} onChange={(e) => setForm({ ...form, grossWeightKgs: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Size (cft)</label>
            <input type="number" className={inputClass} value={form.grossSizeCft} onChange={(e) => setForm({ ...form, grossSizeCft: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Size (cbm)</label>
            <input type="number" className={inputClass} value={form.grossSizeCbm} onChange={(e) => setForm({ ...form, grossSizeCbm: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Declared Value ($)</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={form.declaredValue}
              onChange={(e) => setForm({ ...form, declaredValue: e.target.value })}
            />
          </div>
          <div className="col-span-2 flex items-end sm:col-span-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isVehicle}
                onChange={(e) => setForm({ ...form, isVehicle: e.target.checked })}
              />
              This item is a vehicle
            </label>
          </div>
          {form.isVehicle && (
            <>
              <div>
                <label className={labelClass}>Vehicle Make</label>
                <input className={inputClass} value={form.vehicleMake} onChange={(e) => setForm({ ...form, vehicleMake: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Vehicle Model</label>
                <input className={inputClass} value={form.vehicleModel} onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Vehicle Title #</label>
                <input className={inputClass} value={form.vehicleTitle} onChange={(e) => setForm({ ...form, vehicleTitle: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Vehicle State</label>
                <input className={inputClass} value={form.vehicleState} onChange={(e) => setForm({ ...form, vehicleState: e.target.value })} />
              </div>
            </>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" className={btnPrimaryClass} disabled={busy} onClick={onSave}>
            Save
          </button>
          <button type="button" className={btnClass} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}
