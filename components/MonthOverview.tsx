"use client";

import { useState } from "react";
import { categoryInfo } from "@/lib/categories";
import { currentMonthKey, daysInMonth, money, monthLabel, shiftMonth, todayISO } from "@/lib/dates";
import { parseAmount } from "./AddExpenseForm";
import DonutChart from "./DonutChart";
import type { Expense } from "./ExpenseTracker";

type Props = {
  month: string;
  onMonthChange: (m: string) => void;
  expenses: Expense[];
  budget: number;
  onSaveBudget: (value: number) => Promise<string | null>;
};

export default function MonthOverview({ month, onMonthChange, expenses, budget, onSaveBudget }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isCurrent = month === currentMonthKey();
  const totalDays = daysInMonth(month);
  const daysLeft = isCurrent ? totalDays - Number(todayISO().slice(8, 10)) + 1 : 0;
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const left = budget - spent;
  const perDay = left > 0 && daysLeft > 0 ? left / daysLeft : 0;
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const status = budget <= 0 ? "none" : spent > budget ? "over" : pct >= 75 ? "warn" : "ok";

  const slices = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {}),
  )
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ ...categoryInfo(name), value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const value = parseAmount(draft);
    if (value === null) {
      setError("The allowance must be a positive number, like 800.");
      return;
    }
    const err = await onSaveBudget(value);
    if (err) setError(err);
    else {
      setEditing(false);
      setError(null);
    }
  }

  return (
    <section className="card" aria-labelledby="month-title">
      <div className="month-nav">
        <button
          type="button"
          className="icon-btn nav-btn"
          onClick={() => onMonthChange(shiftMonth(month, -1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2 id="month-title" className="h2" aria-live="polite">
          {monthLabel(month)}
        </h2>
        <button
          type="button"
          className="icon-btn nav-btn"
          onClick={() => onMonthChange(shiftMonth(month, 1))}
          aria-label="Next month"
          disabled={isCurrent}
        >
          ›
        </button>
      </div>

      <div className="stats">
        {isCurrent ? (
          <div className="stat stat-hero">
            <span className="stat-label">You can spend today</span>
            <span className="stat-value">{budget > 0 ? money.format(perDay) : "—"}</span>
            <span className="stat-sub">
              {budget > 0
                ? left > 0
                  ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left this month`
                  : "You've used your whole budget this month"
                : "Enter your monthly allowance to see this"}
            </span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="stat stat-hero">
            <span className="stat-label">Result</span>
            <span className="stat-value">—</span>
            <span className="stat-sub">Nothing tracked this month</span>
          </div>
        ) : (
          <div className="stat stat-hero">
            <span className="stat-label">Result</span>
            <span className="stat-value">
              {budget > 0 ? (left >= 0 ? `${money.format(left)} saved` : `${money.format(-left)} over`) : money.format(spent)}
            </span>
            <span className="stat-sub">{budget > 0 ? `against a ${money.format(budget)} budget` : "spent this month"}</span>
          </div>
        )}
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
            aria-valuenow={Math.min(pct, 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Share of monthly budget spent"
          >
            <span style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <p className="small muted">
            {status === "over"
              ? `Over budget (${pct}%)`
              : status === "warn"
                ? `${pct}% of your ${money.format(budget)} budget used. Slow down a little.`
                : `${pct}% of your ${money.format(budget)} budget used. On track.`}
          </p>
        </div>
      )}

      <div className="budget-row">
        {editing ? (
          <form onSubmit={save} className="budget-form">
            <div className="field grow">
              <label htmlFor="budget">Monthly allowance (€)</label>
              <input
                id="budget"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 800"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setDraft(budget > 0 ? String(budget) : "");
              setEditing(true);
            }}
          >
            {budget > 0 ? "Edit monthly allowance" : "Enter your monthly allowance"}
          </button>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>

      {slices.length > 0 ? (
        <div className="breakdown">
          <DonutChart slices={slices} total={spent} />
          <ul className="legend" aria-label="Spending by category">
            {slices.map((s) => (
              <li key={s.name}>
                <span className="dot" style={{ background: s.color }} aria-hidden="true" />
                <span className="legend-name">
                  <span aria-hidden="true">{s.emoji}</span> {s.name}
                </span>
                <span className="legend-pct muted">{Math.round((s.value / spent) * 100)}%</span>
                <span className="num">{money.format(s.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted small empty-note">No spending with an amount recorded in {monthLabel(month)} yet.</p>
      )}
    </section>
  );
}
