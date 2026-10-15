"use client";

import { useEffect, useMemo, useState } from "react";
import { money, todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { parseAmount } from "./AddExpenseForm";

type Goal = {
  id: string;
  name: string;
  emoji: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
};

const GOAL_COLUMNS = "id, name, emoji, target_amount, saved_amount, target_date";
const EMOJIS = ["🎯", "✈️", "💻", "🎧", "🎁", "🏖️", "🎓", "🚲"];

function toGoal(row: Record<string, unknown>): Goal {
  return {
    ...(row as Goal),
    target_amount: Number(row.target_amount),
    saved_amount: Number(row.saved_amount),
  };
}

function weeksUntil(date: string) {
  const ms = new Date(`${date}T12:00:00`).getTime() - new Date(`${todayISO()}T12:00:00`).getTime();
  return Math.max(ms / (7 * 24 * 3600 * 1000), 0);
}

export default function SavingsGoals({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("savings_goals")
      .select(GOAL_COLUMNS)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error)
          setError(
            error.code === "PGRST205"
              ? "Savings goals are not available yet. Please try again later."
              : `Could not load your goals: ${error.message}`,
          );
        else setGoals((data ?? []).map(toGoal));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function changeSaved(goal: Goal, delta: number) {
    const next = Math.max(0, Math.round((goal.saved_amount + delta) * 100) / 100);
    const { data, error } = await supabase
      .from("savings_goals")
      .update({ saved_amount: next })
      .eq("id", goal.id)
      .select(GOAL_COLUMNS)
      .single();
    if (error) return `Could not update: ${error.message}`;
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? toGoal(data) : g)));
    return null;
  }

  async function remove(goal: Goal) {
    if (!window.confirm(`Delete the goal "${goal.name}"?`)) return;
    const { error } = await supabase.from("savings_goals").delete().eq("id", goal.id);
    if (error) setError(`Could not delete: ${error.message}`);
    else setGoals((prev) => prev.filter((g) => g.id !== goal.id));
  }

  return (
    <section className="card" aria-labelledby="goals-title">
      <div className="row-between">
        <h2 id="goals-title" className="h2">
          Savings goals
        </h2>
        {!creating && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreating(true)}>
            + New goal
          </button>
        )}
      </div>

      {creating && (
        <NewGoalForm
          userId={userId}
          onCancel={() => setCreating(false)}
          onCreated={(g) => {
            setGoals((prev) => [...prev, g]);
            setCreating(false);
          }}
        />
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="skeleton-list" aria-label="Loading">
          <span />
        </div>
      ) : goals.length === 0 && !creating ? (
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">
            🏖️
          </span>
          <p>Saving up for something?</p>
          <p className="muted small">Add a goal like &quot;Summer trip €600&quot; and see how much to put aside each week.</p>
        </div>
      ) : (
        <ul className="goals">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onChange={(d) => changeSaved(g, d)} onDelete={() => remove(g)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function GoalCard({
  goal,
  onChange,
  onDelete,
}: {
  goal: Goal;
  onChange: (delta: number) => Promise<string | null>;
  onDelete: () => void;
}) {
  const [mode, setMode] = useState<"add" | "withdraw" | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pct = Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100));
  const done = goal.saved_amount >= goal.target_amount;
  const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);

  let pace: string | null = null;
  if (!done && goal.target_date) {
    const weeks = weeksUntil(goal.target_date);
    const when = new Date(`${goal.target_date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    pace = weeks < 1 ? `${money.format(remaining)} to go by ${when}` : `Save ${money.format(remaining / weeks)} a week to reach it by ${when}`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseAmount(value);
    if (!amount) return setError("Enter an amount, like 20.");
    const err = await onChange(mode === "withdraw" ? -amount : amount);
    if (err) return setError(err);
    setMode(null);
    setValue("");
    setError(null);
  }

  return (
    <li className={`goal ${done ? "goal-done" : ""}`}>
      <div className="goal-head">
        <span className="goal-emoji" aria-hidden="true">
          {goal.emoji}
        </span>
        <div className="goal-info">
          <span className="goal-name">{goal.name}</span>
          <span className="muted small">
            {money.format(goal.saved_amount)} of {money.format(goal.target_amount)}
          </span>
        </div>
        <span className="goal-pct num">{pct}%</span>
      </div>
      <div
        className="progress progress-goal"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name} progress`}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      {done ? (
        <p className="goal-celebrate">🎉 Goal reached! Well done.</p>
      ) : (
        pace && <p className="small muted goal-pace">{pace}</p>
      )}

      {mode ? (
        <form onSubmit={submit} className="goal-form">
          <label htmlFor={`goal-${goal.id}`} className="sr-only">
            {mode === "add" ? "Amount to add" : "Amount to withdraw"}
          </label>
          <input
            id={`goal-${goal.id}`}
            type="text"
            inputMode="decimal"
            placeholder="€ amount"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary btn-sm">
            {mode === "add" ? "Add" : "Withdraw"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>
            Cancel
          </button>
        </form>
      ) : (
        <div className="goal-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode("add")}>
            + Add money
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setMode("withdraw")}
            disabled={goal.saved_amount <= 0}
          >
            Withdraw
          </button>
          <span className="spacer" />
          <button type="button" className="icon-btn" onClick={onDelete} aria-label={`Delete goal ${goal.name}`}>
            ×
          </button>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

function NewGoalForm({
  userId,
  onCancel,
  onCreated,
}: {
  userId: string;
  onCancel: () => void;
  onCreated: (g: Goal) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseAmount(target);
    if (!name.trim()) return setError("Give your goal a name, like \"Summer trip\".");
    if (!amount) return setError("Enter how much you want to save, like 600.");
    setBusy(true);
    const { data, error } = await supabase
      .from("savings_goals")
      .insert({ name: name.trim(), target_amount: amount, target_date: date || null, emoji, user_id: userId })
      .select(GOAL_COLUMNS)
      .single();
    setBusy(false);
    if (error) return setError(`Could not create the goal: ${error.message}`);
    onCreated(toGoal(data));
  }

  return (
    <form onSubmit={submit} className="new-goal">
      <fieldset className="chips-field">
        <legend>Icon</legend>
        <div className="chips">
          {EMOJIS.map((em) => (
            <label key={em} className="chip chip-emoji">
              <input type="radio" name="goal-emoji" value={em} checked={emoji === em} onChange={() => setEmoji(em)} />
              <span>{em}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="goal-name">Goal</label>
        <input
          id="goal-name"
          type="text"
          placeholder="e.g. Summer trip"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="add-row">
        <div className="field">
          <label htmlFor="goal-target">Target (€)</label>
          <input
            id="goal-target"
            type="text"
            inputMode="decimal"
            placeholder="600"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="goal-date">By (optional)</label>
          <input id="goal-date" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="edit-actions">
        <span className="spacer" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          Create goal
        </button>
      </div>
    </form>
  );
}
