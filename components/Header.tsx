import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href={user ? "/app" : "/"} className="brand" aria-label="Pocket home">
          <span className="brand-mark" aria-hidden="true">€</span>
          Pocket
        </Link>
        <nav aria-label="Account">
          {user ? (
            <div className="header-actions">
              <Link href="/app" className="link">
                My budget
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <Link href="/login" className="link">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
