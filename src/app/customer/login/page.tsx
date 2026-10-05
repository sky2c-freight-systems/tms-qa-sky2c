"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "form" | "otp";

const inputClass =
  "w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-100";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) {
      setError("Enter an email or phone number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customer/login/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() || undefined, phone: phone.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to send verification code");
      setSentTo(body.sentTo ?? null);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customer/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() || undefined, phone: phone.trim() || undefined, code: code.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Invalid or expired code");
      router.push("/customer/shipments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Log in</h1>
      <p className="mt-1 text-sm text-slate-500">Enter your email or phone number to receive a login code.</p>

      {step === "form" ? (
        <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Email</span>
            <input
              type="email"
              className={inputClass}
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </label>
          <div className="text-center text-xs uppercase tracking-wide text-slate-400">or</div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Phone</span>
            <input
              type="tel"
              className={inputClass}
              value={phone}
              disabled={loading}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending code..." : "Send login code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
          <p className="text-sm text-slate-600">
            We sent a 6-digit code to <span className="font-medium">{sentTo}</span>.
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Verification code</span>
            <input
              className={`${inputClass} text-center text-lg tracking-widest`}
              value={code}
              disabled={loading}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              inputMode="numeric"
              autoFocus
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || code.trim().length !== 6}
            className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Log in"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setStep("form");
              setCode("");
              setError(null);
            }}
            className="w-full text-center text-xs text-slate-500 hover:underline"
          >
            Use a different email or phone
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        New here?{" "}
        <Link href="/customer/register" className="text-blue-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
