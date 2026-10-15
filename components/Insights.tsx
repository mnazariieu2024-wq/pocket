import { categoryInfo } from "@/lib/categories";
import { currentMonthKey, daysInMonth, money, ordinal, shiftMonth, todayISO } from "@/lib/dates";
import type { Expense } from "./ExpenseTracker";

type Tip = { icon: string; tone: "good" | "warn" | "info"; text: string };

const FIXED_COSTS = ["Rent & bills", "Subscriptions"];

function sumByCategory(list: Expense[]) {
  return list.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
}

/** Rule-based tips computed from the user's own expenses. No AI, no external calls. */
export function buildTips(expenses: Expense[], budget: number): Tip[] {
  const month = currentMonthKey();
  const day = Number(todayISO().slice(8, 10));
  const totalDays = daysInMonth(month);
  const thisMonth = expenses.filter((e) => e.spent_on.startsWith(month));
  const spent = thisMonth.reduce((s, e) => s + e.amount, 0);
  const tips: Tip[] = [];

  // 1. Pace: will the budget last until the end of the month?
  // Fixed costs (rent, subscriptions) are paid once, so only day-to-day spending is projected forward.
  if (budget > 0 && spent > 0) {
    const fixed = thisMonth.filter((e) => FIXED_COSTS.includes(e.category)).reduce((s, e) => s + e.amount, 0);
    const perDay = (spent - fixed) / day;
    const projected = fixed + perDay * totalDays;
    const runOutDay = perDay > 0 ? Math.ceil((budget - fixed) / perDay) : Infinity;
    if (spent > budget) {
      tips.push({ icon: "🚨", tone: "warn", text: `You're ${money.format(spent - budget)} over your monthly budget already.` });
    } else if (runOutDay <= totalDays) {
      tips.push({
        icon: "⏳",
        tone: "warn",
        text: `At this pace your budget runs out around the ${ordinal(runOutDay)}. Try to stay under ${money.format(
          (budget - spent) / (totalDays - day + 1),
        )} a day.`,
      });
    } else {
      tips.push({
        icon: "✅",
        tone: "good",
        text: `At this pace you'll finish the month with about ${money.format(budget - projected)} left.`,
      });
    }
  }

  // 2. Category change vs the same point last month
  const lastMonth = shiftMonth(month, -1);
  const lastSamePeriod = expenses.filter(
    (e) => e.spent_on.startsWith(lastMonth) && Number(e.spent_on.slice(8, 10)) <= day,
  );
  if (lastSamePeriod.length > 0) {
    const now = sumByCategory(thisMonth);
    const before = sumByCategory(lastSamePeriod);
    const changes = Object.keys({ ...now, ...before })
      .map((cat) => ({ cat, now: now[cat] ?? 0, before: before[cat] ?? 0 }))
      .filter((c) => c.before >= 10)
      .map((c) => ({ ...c, change: (c.now - c.before) / c.before }));
    const up = changes.filter((c) => c.change >= 0.25).sort((a, b) => b.change - a.change)[0];
    const down = changes.filter((c) => c.change <= -0.25).sort((a, b) => a.change - b.change)[0];
    if (up)
      tips.push({
        icon: "📈",
        tone: "warn",
        text: `You've spent ${Math.round(up.change * 100)}% more on ${up.cat} than by this point last month.`,
      });
    if (down)
      tips.push({
        icon: "📉",
        tone: "good",
        text: `Nice: ${Math.round(-down.change * 100)}% less on ${down.cat} than by this point last month.`,
      });
  }

  // 3. Biggest category share
  const totals = Object.entries(sumByCategory(thisMonth)).sort((a, b) => b[1] - a[1]);
  if (spent > 0 && totals.length > 1) {
    const [cat, value] = totals[0];
    const share = Math.round((value / spent) * 100);
    if (share >= 30) {
      tips.push({ icon: categoryInfo(cat).emoji, tone: "info", text: `${cat} is ${share}% of your spending this month.` });
    }
  }

  // 4. Biggest single expense
  const biggest = [...thisMonth].sort((a, b) => b.amount - a.amount)[0];
  if (biggest && biggest.amount > 0 && thisMonth.length >= 3) {
    tips.push({
      icon: "🔎",
      tone: "info",
      text: `Your biggest expense this month: "${biggest.description}" (${money.format(biggest.amount)}).`,
    });
  }

  if (budget <= 0 && thisMonth.length > 0) {
    tips.push({ icon: "🎯", tone: "info", text: "Set a monthly budget to see how much you can spend each day." });
  }

  return tips.slice(0, 3);
}

export default function Insights({ expenses, budget }: { expenses: Expense[]; budget: number }) {
  const tips = buildTips(expenses, budget);

  return (
    <section className="card" aria-labelledby="insights-title">
      <h2 id="insights-title" className="h2">
        Insights
      </h2>
      {tips.length === 0 ? (
        <p className="muted small empty-note">Add a few expenses with amounts and Pocket will start spotting patterns.</p>
      ) : (
        <ul className="tips">
          {tips.map((t) => (
            <li key={t.text} className={`tip tip-${t.tone}`}>
              <span className="tip-icon" aria-hidden="true">
                {t.icon}
              </span>
              <span>{t.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
