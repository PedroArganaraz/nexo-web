import Link from "next/link";
import Image from "next/image";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";
import AdminNav from "./AdminNav";

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
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/NEXO_transparent.png"
                  alt="Nexo Estudio"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
              <AdminNav />
            </div>
            <LogoutButton />
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12">{children}</main>

      <Toaster position="top-center" richColors />
    </div>
  );
}
