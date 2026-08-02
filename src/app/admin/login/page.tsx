"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full bg-white border border-[#e0e0e0] rounded-sm px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#aaaaaa] outline-none focus:border-[#1a1a1a] transition-colors duration-200";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const email = (data.get("email") as string).trim();
    const password = data.get("password") as string;

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.refresh();
    router.push("/admin/proyectos");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-alt px-6">
      <div className="w-full max-w-sm bg-white border border-[#e0e0e0] rounded-sm p-8">
        <h1 className="font-heading font-bold text-2xl text-[#1a1a1a] text-center mb-8">
          Panel de administración
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className={inputClass}
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            required
            className={inputClass}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-8 py-3 rounded-full hover:bg-accent transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
