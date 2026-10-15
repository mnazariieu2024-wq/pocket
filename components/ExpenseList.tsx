"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, categoryInfo } from "@/lib/categories";
import { formatDay, money, monthLabel, todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { parseAmount } from "./AddExpenseForm";
import { EXPENSE_COLUMNS, type Expense } from "./ExpenseTracker";

type Props = {
  month: string;
  expenses: Expense[];
  loading: boolean;
  newId: string | null;
  onUpdated: (e: Expense) => void;
  onDeleted: (id: string) => void;
};

export default function ExpenseList({ month, expenses, loading, newId, onUpdated, onDeleted }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);

  const visible = expenses.filter(
    (e) =>
      (filter === "All" || e.category === filter) &&
      (query.trim() === "" || e.description.toLowerCase().includes(query.trim().toLowerCase())),
  );

  const groups = visible.reduce<{ day: string; items: Expense[]; total: number }[]>((acc, item) => {
    const last = acc[acc.length - 1];
    if (last && last.day === item.spent_on) {
      last.items.push(item);
      last.total += item.amount;
    } else acc.push({ day: item.spent_on, items: [item], total: item.amount });
    return acc;
  }, []);

  return (
    <section className="card" aria-labelledby="list-title">
      <div className="row-between">
        <h2 id="list-title" className="h2">
          Your expenses
        </h2>
        <span className="muted small">
          {visible.length} in {monthLabel(month)}
        </span>
      </div>

      {expenses.length > 0 && (
        <div className="list-tools">
          <div className="field grow">
            <label htmlFor="search" className="sr-only">
              Search expenses
            </label>
            <input
              id="search"
              type="search"
              placeholder="🔍 Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="filter" className="sr-only">
              Filter by category
            </label>
            <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="skeleton-list" aria-label="Loading">
          <span />
          <span />
          <span />
        </div>
      ) : expenses.length === 0 ? (
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">
            🧾
          </span>
          <p>No expenses in {monthLabel(month)} yet.</p>
          <p className="muted small">Add your first one above. It takes 5 seconds.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="muted empty-note">No expenses match your search.</p>
      ) : (
        <div className="stack">
          {groups.map((g) => (
            <div key={g.day}>
              <h3 className="day-title">
                <span>{formatDay(g.day)}</span>
                <span className="num">{money.format(g.total)}</span>
              </h3>
              <ul className="expense-list">
                {g.items.map((item) =>
                  editingId === item.id ? (
                    <li key={item.id} className="expense expense-editing" data-testid="core-item">
                      <EditExpense
                        item={item}
                        onCancel={() => setEditingId(null)}
                        onSaved={(e) => {
                          onUpdated(e);
                          setEditingId(null);
                        }}
                        onDeleted={() => {
                          onDeleted(item.id);
                          setEditingId(null);
                        }}
                      />
                    </li>
                  ) : (
                    <li
                      key={item.id}
                      className={`expense ${item.id === newId ? "expense-new" : ""}`}
                      data-testid="core-item"
                    >
                      <button
                        type="button"
                        className="expense-btn"
                        onClick={() => setEditingId(item.id)}
                        aria-label={`Edit ${item.description}`}
                      >
                        <span
                          className="cat-badge"
                          style={{ "--chip": categoryInfo(item.category).color } as React.CSSProperties}
                          aria-hidden="true"
                        >
                          {categoryInfo(item.category).emoji}
                        </span>
                        <span className="expense-main">
                          <span className="expense-desc">{item.description}</span>
                          <span className="expense-cat">{item.category}</span>
                        </span>
                        <span className="num">{money.format(item.amount)}</span>
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EditExpense({
  item,
  onCancel,
  onSaved,
  onDeleted,
}: {
  item: Expense;
  onCancel: () => void;
  onSaved: (e: Expense) => void;
  onDeleted: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [description, setDescription] = useState(item.description);
  const [amount, setAmount] = useState(item.amount ? String(item.amount) : "");
  const [category, setCategory] = useState(item.category);
  const [date, setDate] = useState(item.spent_on);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idp = `edit-${item.id}`;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const text = description.trim();
    const value = parseAmount(amount);
    if (!text) return setError("The description can't be empty.");
    if (value === null) return setError("The amount must be a positive number, like 4.50.");
    setBusy(true);
    const { data, error } = await supabase
      .from("expenses")
      .update({ description: text, amount: value, category, spent_on: date || todayISO() })
      .eq("id", item.id)
      .select(EXPENSE_COLUMNS)
      .single();
    setBusy(false);
    if (error) return setError(`Could not save: ${error.message}`);
    onSaved({ ...data, amount: Number(data.amount) });
  }

  async function remove() {
    if (!window.confirm(`Delete "${item.description}"?`)) return;
    setBusy(true);
    const { error } = await supabase.from("expenses").delete().eq("id", item.id);
    setBusy(false);
    if (error) return setError(`Could not delete: ${error.message}`);
    onDeleted();
  }

  return (
    <form onSubmit={save} className="edit-form" aria-label={`Edit ${item.description}`}>
      <div className="field">
        <label htmlFor={`${idp}-desc`}>Description</label>
        <input
          id={`${idp}-desc`}
          type="text"
          maxLength={200}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoFocus
        />
      </div>
      <div className="edit-grid">
        <div className="field">
          <label htmlFor={`${idp}-amount`}>Amount (€)</label>
          <input
            id={`${idp}-amount`}
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idp}-cat`}>Category</label>
          <select id={`${idp}-cat`} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${idp}-date`}>Date</label>
          <input id={`${idp}-date`} type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="edit-actions">
        <button type="button" className="btn btn-danger-ghost btn-sm" onClick={remove} disabled={busy}>
          Delete
        </button>
        <span className="spacer" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          Save
        </button>
      </div>
    </form>
  );
}
