import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="container landing">
      <section className="hero">
        <p className="eyebrow">For students living away from home</p>
        <h1 className="hero-title">Know exactly how much you can spend today.</h1>
        <p className="hero-sub">
          Pocket is a simple expense tracker for students who just moved out. Log what you spend in seconds, set a
          monthly budget, and see your daily allowance so you never run out of money before the month ends.
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
          <li className="expense">
            <div className="expense-main">
              <span className="expense-desc">Groceries at Mercadona</span>
              <span className="expense-cat">Groceries</span>
            </div>
            <span className="num">€23.10</span>
          </li>
          <li className="expense">
            <div className="expense-main">
              <span className="expense-desc">Metro card top-up</span>
              <span className="expense-cat">Transport</span>
            </div>
            <span className="num">€12.00</span>
          </li>
          <li className="expense">
            <div className="expense-main">
              <span className="expense-desc">Dinner with flatmates</span>
              <span className="expense-cat">Eating out</span>
            </div>
            <span className="num">€15.50</span>
          </li>
        </ul>
      </section>

      <section className="steps" aria-labelledby="how-title">
        <h2 id="how-title" className="h2 center">
          How it works
        </h2>
        <ol className="step-list">
          <li>
            <strong>Set your monthly budget</strong>
            <span>What you have for the month: allowance, part-time job, scholarship.</span>
          </li>
          <li>
            <strong>Add each expense in 5 seconds</strong>
            <span>Just type what you bought. Amount and category are optional.</span>
          </li>
          <li>
            <strong>Check your daily allowance</strong>
            <span>Pocket tells you how much you can still spend each day this month.</span>
          </li>
        </ol>
        <p className="small muted center">Your data is private: only you can see your expenses.</p>
      </section>
    </div>
  );
}
