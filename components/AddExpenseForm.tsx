"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, DEFAULT_CATEGORY } from "@/lib/categories";
import { todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_COLUMNS, type Expense } from "./ExpenseTracker";

export function parseAmount(raw: string): number | null {
  if (raw.trim() === "") return 0;
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null;
}

export default function AddExpenseForm({ userId, onAdded }: { userId: string; onAdded: (e: Expense) => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = description.trim();
    if (!text) {
      setError("Please write what you spent money on.");
      return;
    }
    const value = parseAmount(amount);
    if (value === null) {
      setError("The amount must be a positive number, like 4.50.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from("expenses")
      .insert({ description: text, amount: value, category, spent_on: date || todayISO(), user_id: userId })
      .select(EXPENSE_COLUMNS)
      .single();
    setSaving(false);
    if (error) {
      setError(`Could not save: ${error.message}`);
      return;
    }
    onAdded({ ...data, amount: Number(data.amount) });
    setDescription("");
    setAmount("");
    setCategory(DEFAULT_CATEGORY);
    setDate(todayISO());
    setSavedMsg(`Saved "${text}"`);
    window.setTimeout(() => setSavedMsg(null), 2500);
  }

  return (
    <section className="card add-card" aria-labelledby="add-title">
      <h1 id="add-title" className="h2">
        Add an expense
      </h1>
      <form onSubmit={submit} className="add-form">
        <div className="field">
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

        <fieldset className="chips-field">
          <legend>Category</legend>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <label key={c.name} className="chip" style={{ "--chip": c.color } as React.CSSProperties}>
                <input
                  type="radio"
                  name="category"
                  value={c.name}
                  checked={category === c.name}
                  onChange={() => setCategory(c.name)}
                />
                <span>
                  <span aria-hidden="true">{c.emoji}</span> {c.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

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
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={saving} data-testid="core-submit">
          {saving ? "Saving…" : "Add expense"}
        </button>
      </form>
      <p className="sr-only" aria-live="polite">
        {savedMsg ?? ""}
      </p>
      {savedMsg && (
        <p className="toast" aria-hidden="true">
          ✓ {savedMsg}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
