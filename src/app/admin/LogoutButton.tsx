"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm text-[#1a1a1a] border border-[#e0e0e0] rounded-full px-4 py-1.5 cursor-pointer hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-colors duration-200"
    >
      Cerrar sesión
    </button>
  );
}
