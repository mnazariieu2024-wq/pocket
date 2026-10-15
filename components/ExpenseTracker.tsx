"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  spent_on: string;
  created_at: string;
};

const CATEGORIES = [
  "Groceries",
  "Rent & bills",
  "Eating out",
  "Transport",
  "Going out",
  "Study & books",
  "Subscriptions",
  "Other",
];

const money = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDay(iso: string) {
  if (iso === todayISO()) return "Today";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export default function ExpenseTracker({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [saving, setSaving] = useState(false);

  const [budgetDraft, setBudgetDraft] = useState("");
  const [editingBudget, setEditingBudget] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [expRes, budRes] = await Promise.all([
        supabase
          .from("expenses")
          .select("id, description, amount, category, spent_on, created_at")
          .order("spent_on", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("budgets").select("monthly_amount").maybeSingle(),
      ]);
      if (cancelled) return;
      if (expRes.error) setError(`Could not load your expenses: ${expRes.error.message}`);
      else setExpenses((expRes.data ?? []).map((e) => ({ ...e, amount: Number(e.amount) })));
      if (budRes.data) setBudget(Number(budRes.data.monthly_amount));
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // This month's numbers
  const now = new Date();
  const monthPrefix = todayISO().slice(0, 7);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1;
  const thisMonth = expenses.filter((e) => e.spent_on.startsWith(monthPrefix));
  const spent = thisMonth.reduce((sum, e) => sum + e.amount, 0);
  const left = budget - spent;
  const perDay = left > 0 ? left / daysLeft : 0;
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const status = budget <= 0 ? "none" : spent > budget ? "over" : pct >= 75 ? "warn" : "ok";

  const byCategory = Object.entries(
    thisMonth.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {}),
  )
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1]);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const text = description.trim();
    if (!text) {
      setError("Please write what you spent money on.");
      return;
    }
    const value = amount.trim() === "" ? 0 : Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value < 0) {
      setError("The amount must be a positive number, like 4.50.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from("expenses")
      .insert({ description: text, amount: value, category, user_id: userId })
      .select("id, description, amount, category, spent_on, created_at")
      .single();
    setSaving(false);
    if (error) {
      setError(`Could not save: ${error.message}`);
      return;
    }
    setExpenses((prev) => [{ ...data, amount: Number(data.amount) }, ...prev]);
    setDescription("");
    setAmount("");
    setCategory("Other");
  }

  async function deleteExpense(item: Expense) {
    if (!window.confirm(`Delete "${item.description}"?`)) return;
    const { error } = await supabase.from("expenses").delete().eq("id", item.id);
    if (error) {
      setError(`Could not delete: ${error.message}`);
      return;
    }
    setExpenses((prev) => prev.filter((x) => x.id !== item.id));
  }

  async function saveBudget(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(budgetDraft.replace(",", "."));
    if (!Number.isFinite(value) || value < 0) {
      setError("The budget must be a positive number, like 800.");
      return;
    }
    const { error } = await supabase
      .from("budgets")
      .upsert({ user_id: userId, monthly_amount: value, updated_at: new Date().toISOString() });
    if (error) {
      setError(`Could not save your budget: ${error.message}`);
      return;
    }
    setBudget(value);
    setEditingBudget(false);
    setError(null);
  }

  // Group the list by day
  const groups = expenses.reduce<{ day: string; items: Expense[] }[]>((acc, item) => {
    const last = acc[acc.length - 1];
    if (last && last.day === item.spent_on) last.items.push(item);
    else acc.push({ day: item.spent_on, items: [item] });
    return acc;
  }, []);

  return (
    <div className="stack-lg">
      <section className="card add-card" aria-labelledby="add-title">
        <h1 id="add-title" className="h2">
          Add an expense
        </h1>
        <form onSubmit={addExpense} className="add-form">
          <div className="field grow">
            <label htmlFor="description">What did you spend on?</label>
            <input
              id="description"
              type="text"
              placeholder="e.g. Groceries at Mercadona"
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="core-input"
              autoComplete="off"
            />
          </div>
          <div className="add-row">
            <div className="field">
              <label htmlFor="amount">Amount (€)</label>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={saving} data-testid="core-submit">
            {saving ? "Saving…" : "Add expense"}
          </button>
        </form>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="card" aria-labelledby="month-title">
        <div className="row-between">
          <h2 id="month-title" className="h2">
            {now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </h2>
          {!editingBudget && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setBudgetDraft(budget > 0 ? String(budget) : "");
                setEditingBudget(true);
              }}
            >
              {budget > 0 ? "Edit budget" : "Set budget"}
            </button>
          )}
        </div>

        {editingBudget && (
          <form onSubmit={saveBudget} className="budget-form">
            <div className="field grow">
              <label htmlFor="budget">Monthly budget (€)</label>
              <input
                id="budget"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 800"
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingBudget(false)}>
              Cancel
            </button>
          </form>
        )}

        <div className="stats">
          <div className="stat stat-hero">
            <span className="stat-label">You can spend today</span>
            <span className="stat-value">{budget > 0 ? money.format(perDay) : "—"}</span>
            <span className="stat-sub">
              {budget > 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left this month` : "Set a monthly budget to see this"}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Spent</span>
            <span className="stat-value">{money.format(spent)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">{left < 0 ? "Over budget by" : "Left"}</span>
            <span className={`stat-value ${left < 0 ? "text-danger" : ""}`}>
              {budget > 0 ? money.format(Math.abs(left)) : "—"}
            </span>
          </div>
        </div>

        {budget > 0 && (
          <div className="progress-wrap">
            <div
              className={`progress progress-${status}`}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Share of monthly budget spent"
            >
              <span style={{ width: `${pct}%` }} />
            </div>
            <p className="small muted">
              {status === "over"
                ? "Over budget"
                : status === "warn"
                  ? `${pct}% of your budget used — slow down a little`
                  : `${pct}% of your budget used — on track`}
            </p>
          </div>
        )}

        {byCategory.length > 0 && (
          <ul className="cat-list" aria-label="Spending by category this month">
            {byCategory.map(([name, total]) => (
              <li key={name}>
                <span>{name}</span>
                <span className="cat-bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(4, (total / byCategory[0][1]) * 100)}%` }} />
                </span>
                <span className="num">{money.format(total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="list-title">
        <h2 id="list-title" className="h2">
          Your expenses
        </h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : expenses.length === 0 ? (
          <p className="muted">No expenses yet. Add your first one above — it takes 5 seconds.</p>
        ) : (
          <div className="stack">
            {groups.map((g) => (
              <div key={g.day}>
                <h3 className="day-title">{formatDay(g.day)}</h3>
                <ul className="expense-list">
                  {g.items.map((item) => (
                    <li key={item.id} className="expense" data-testid="core-item">
                      <div className="expense-main">
                        <span className="expense-desc">{item.description}</span>
                        <span className="expense-cat">{item.category}</span>
                      </div>
                      <span className="num">{money.format(item.amount)}</span>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => deleteExpense(item)}
                        aria-label={`Delete ${item.description}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
