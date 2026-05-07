"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
      className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors text-sm"
    >
      Sign out
    </button>
  );
}
