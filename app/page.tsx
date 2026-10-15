import Link from "next/link";
import { categoryInfo } from "@/lib/categories";

const SAMPLE = [
  { description: "Groceries at Mercadona", category: "Groceries", amount: "€23.10" },
  { description: "Metro card top-up", category: "Transport", amount: "€12.00" },
  { description: "Dinner with flatmates", category: "Eating out", amount: "€15.50" },
];

export default function LandingPage() {
  return (
    <div className="container landing">
      <section className="hero">
        <p className="eyebrow">For students on a tight monthly allowance</p>
        <h1 className="hero-title">Know exactly how much you can spend today.</h1>
        <p className="hero-sub">
          Pocket is a simple expense tracker for students living on a fixed monthly allowance. Log what you spend in
          seconds and see exactly how much you can still spend each day, so your money lasts until the next transfer.
        </p>
        <Link href="/signup" className="btn btn-primary btn-lg">
          Sign up free
        </Link>
        <p className="small muted">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </section>

      <section className="preview card" aria-label="Example of what you see in Pocket">
        <div className="stat stat-hero">
          <span className="stat-label">You can spend today</span>
          <span className="stat-value">€18.40</span>
          <span className="stat-sub">16 days left this month</span>
        </div>
        <ul className="expense-list">
          {SAMPLE.map((s) => {
            const cat = categoryInfo(s.category);
            return (
              <li key={s.description} className="expense">
                <span className="cat-badge" style={{ "--chip": cat.color } as React.CSSProperties} aria-hidden="true">
                  {cat.emoji}
                </span>
                <div className="expense-main">
                  <span className="expense-desc">{s.description}</span>
                  <span className="expense-cat">{s.category}</span>
                </div>
                <span className="num">{s.amount}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <ul className="features" aria-label="Features">
        <li className="feature">
          <span className="feature-icon" aria-hidden="true">⚡</span>
          <div>
            <strong>Add an expense in 5 seconds</strong>
            <span>Type what you bought, tap a category, done.</span>
          </div>
        </li>
        <li className="feature">
          <span className="feature-icon" aria-hidden="true">📊</span>
          <div>
            <strong>See where your money goes</strong>
            <span>A clear chart by category, month by month.</span>
          </div>
        </li>
        <li className="feature">
          <span className="feature-icon" aria-hidden="true">💡</span>
          <div>
            <strong>Tips that warn you early</strong>
            <span>&quot;At this pace your budget runs out on the 24th.&quot;</span>
          </div>
        </li>
        <li className="feature">
          <span className="feature-icon" aria-hidden="true">🏖️</span>
          <div>
            <strong>Save for what matters</strong>
            <span>Set a goal like a summer trip and track it weekly.</span>
          </div>
        </li>
      </ul>

      <section className="steps" aria-labelledby="how-title">
        <h2 id="how-title" className="h2 center">
          How it works
        </h2>
        <ol className="step-list">
          <li>
            <strong>Enter your monthly allowance</strong>
            <span>What you get each month from parents, a scholarship or a part-time job.</span>
          </li>
          <li>
            <strong>Add each expense as you go</strong>
            <span>Just type what you bought. Amount and category are optional.</span>
          </li>
          <li>
            <strong>Check what you can spend today</strong>
            <span>Pocket splits what's left over the remaining days, so you never run out before the month ends.</span>
          </li>
        </ol>
        <p className="small muted center">Your data is private: only you can see your expenses.</p>
      </section>
    </div>
  );
}
