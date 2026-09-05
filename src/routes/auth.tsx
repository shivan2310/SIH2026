import { createFileRoute, useNavigate, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Atom, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signIn as localSignIn, signUp as localSignUp } from "@/lib/auth/actions";
import { useSession } from "@/hooks/useSession";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Save your quantum circuits | QuantumLab" },
      {
        name: "description",
        content:
          "Create a QuantumLab account to save quantum circuits locally, share them and keep your workspace organized.",
      },
      { property: "og:title", content: "Sign in to QuantumLab" },
      {
        property: "og:description",
        content:
          "Save your quantum circuits with a free QuantumLab account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/lab", replace: true });
  }, [loading, user, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await localSignIn({ data: { email, password } });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      void router.invalidate();
      toast.success("Welcome back");
      void navigate({ to: "/lab", replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in");
    } finally {
      setBusy(false);
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await localSignUp({ data: { email, password } });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      void router.invalidate();
      toast.success("Account created successfully");
      void navigate({ to: "/lab", replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to sign up");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F5] font-sans text-[#111111] px-4 py-12">
      <Link to="/" className="mb-10 flex items-center gap-2">
        <Atom className="h-8 w-8 text-[#111111]" />
        <span className="text-2xl font-bold tracking-tight text-[#111111]">
          Quantum<span className="text-[#111111]">Lab</span>
        </span>
      </Link>

      <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
          Your circuits, everywhere
        </h1>
        <p className="mt-2 text-sm font-medium text-[#707070]">
          Sign in to save circuits and organize your workspace.
        </p>

        <div className="mt-8">
          <div className="flex w-full rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setTab("signin")}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                tab === "signin"
                  ? "bg-white text-[#111111] shadow-sm"
                  : "text-[#707070] hover:text-[#111111]"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                tab === "signup"
                  ? "bg-white text-[#111111] shadow-sm"
                  : "text-[#707070] hover:text-[#111111]"
              }`}
            >
              Create account
            </button>
          </div>

          <div className="mt-8">
            {tab === "signin" ? (
              <form className="space-y-4" onSubmit={(e) => void signIn(e)}>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-bold text-[#111111]">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm font-medium text-[#111111] outline-none transition-colors focus:border-[#F47F45] focus:ring-1 focus:ring-[#F47F45]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-bold text-[#111111]">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm font-medium text-[#111111] outline-none transition-colors focus:border-[#F47F45] focus:ring-1 focus:ring-[#F47F45]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#F47F45] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E3692E] disabled:opacity-70"
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={(e) => void signUp(e)}>
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-bold text-[#111111]">
                    Display name
                  </label>
                  <input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm font-medium text-[#111111] outline-none transition-colors focus:border-[#F47F45] focus:ring-1 focus:ring-[#F47F45]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email-up" className="text-sm font-bold text-[#111111]">
                    Email
                  </label>
                  <input
                    id="email-up"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm font-medium text-[#111111] outline-none transition-colors focus:border-[#F47F45] focus:ring-1 focus:ring-[#F47F45]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password-up" className="text-sm font-bold text-[#111111]">
                    Password
                  </label>
                  <input
                    id="password-up"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm font-medium text-[#111111] outline-none transition-colors focus:border-[#F47F45] focus:ring-1 focus:ring-[#F47F45]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#F47F45] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E3692E] disabled:opacity-70"
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
