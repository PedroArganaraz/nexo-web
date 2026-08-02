import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-bg-alt">
      {user && (
        <header className="bg-white border-b border-[#e0e0e0]">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="font-heading font-bold text-lg text-[#1a1a1a]">
              Panel de administración
            </span>
            <LogoutButton />
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-6 py-12">{children}</main>
    </div>
  );
}
