"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { currentMonthKey } from "@/lib/dates";
import AddExpenseForm from "./AddExpenseForm";
import ExpenseList from "./ExpenseList";
import Insights from "./Insights";
import MonthOverview from "./MonthOverview";
import SavingsGoals from "./SavingsGoals";

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  spent_on: string;
  created_at: string;
};

export const EXPENSE_COLUMNS = "id, description, amount, category, spent_on, created_at";

function sortExpenses(list: Expense[]) {
  return [...list].sort((a, b) =>
    a.spent_on === b.spent_on ? b.created_at.localeCompare(a.created_at) : b.spent_on.localeCompare(a.spent_on),
  );
}

export default function ExpenseTracker({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState(0);
  const [month, setMonth] = useState(currentMonthKey());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [expRes, budRes] = await Promise.all([
        supabase
          .from("expenses")
          .select(EXPENSE_COLUMNS)
          .order("spent_on", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(2000),
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

  function handleAdded(item: Expense) {
    setExpenses((prev) => sortExpenses([item, ...prev]));
    setNewId(item.id);
    setMonth(item.spent_on.slice(0, 7));
  }

  function handleUpdated(item: Expense) {
    setExpenses((prev) => sortExpenses(prev.map((e) => (e.id === item.id ? item : e))));
  }

  function handleDeleted(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  async function saveBudget(value: number) {
    const { error } = await supabase
      .from("budgets")
      .upsert({ user_id: userId, monthly_amount: value, updated_at: new Date().toISOString() });
    if (error) return `Could not save your budget: ${error.message}`;
    setBudget(value);
    return null;
  }

  const monthExpenses = expenses.filter((e) => e.spent_on.startsWith(month));

  return (
    <div className="stack-lg">
      <AddExpenseForm userId={userId} onAdded={handleAdded} />

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <MonthOverview
        month={month}
        onMonthChange={setMonth}
        expenses={monthExpenses}
        budget={budget}
        onSaveBudget={saveBudget}
      />

      {month === currentMonthKey() && !loading && <Insights expenses={expenses} budget={budget} />}

      <ExpenseList
        month={month}
        expenses={monthExpenses}
        loading={loading}
        newId={newId}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />

      <SavingsGoals userId={userId} />
    </div>
  );
}
