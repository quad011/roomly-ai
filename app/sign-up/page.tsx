"use client";

import Link from "next/link";
import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  const { signUp, fetchStatus } = useSignUp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [verificationStep, setVerificationStep] = useState(false);
  const [error, setError] = useState("");

  const loading = fetchStatus === "fetching";

  const getErrorMessage = (err: any, fallback: string) => {
    return (
      err?.errors?.[0]?.longMessage ||
      err?.errors?.[0]?.message ||
      err?.longMessage ||
      err?.message ||
      fallback
    );
  };

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Please complete all fields.");
      return;
    }

    if (password.length < 15) {
      setError("Password must be at least 15 characters.");
      return;
    }

    setError("");

    try {
      // Create signup with email + password.
      // Name is added later using signUp.update().
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      // Send email verification code.
      const { error: verificationError } =
        await signUp.verifications.sendEmailCode();

      if (verificationError) {
        setError(
          verificationError.longMessage ||
            verificationError.message ||
            "Unable to send verification code."
        );
        return;
      }

      setVerificationStep(true);
    } catch (err: any) {
      console.error("========== CLERK SIGNUP ERROR ==========");
      console.error("FULL ERROR:", err);
      console.error("ERRORS:", err?.errors);
      console.error("FIRST ERROR:", err?.errors?.[0]);
      console.error("CODE:", err?.errors?.[0]?.code);
      console.error("MESSAGE:", err?.errors?.[0]?.message);
      console.error("LONG MESSAGE:", err?.errors?.[0]?.longMessage);
      console.error("META:", err?.errors?.[0]?.meta);
      console.error("========================================");

      setError(
        getErrorMessage(
          err,
          "Unable to create your account."
        )
      );
    }
  };

  const handleVerification = async () => {
    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setError("");

    try {
      // Verify email.
      const { error: verificationError } =
        await signUp.verifications.verifyEmailCode({
          code: code.trim(),
        });

      if (verificationError) {
        setError(
          verificationError.longMessage ||
            verificationError.message ||
            "Invalid verification code."
        );
        return;
      }

      // Split full name into first and last name.
      const nameParts = name.trim().split(/\s+/);

      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Save name to Clerk.
      await signUp.update({
        firstName,
        lastName,
      });

      // Finalize signup.
      await signUp.finalize({
        navigate: () => {
          window.location.href = "/";
        },
      });
    } catch (err: any) {
      console.error(
        "========== CLERK VERIFICATION ERROR =========="
      );
      console.error("FULL ERROR:", err);
      console.error("ERRORS:", err?.errors);
      console.error("FIRST ERROR:", err?.errors?.[0]);
      console.error("CODE:", err?.errors?.[0]?.code);
      console.error("MESSAGE:", err?.errors?.[0]?.message);
      console.error(
        "LONG MESSAGE:",
        err?.errors?.[0]?.longMessage
      );
      console.error("META:", err?.errors?.[0]?.meta);
      console.error(
        "================================================"
      );

      setError(
        getErrorMessage(
          err,
          "Unable to complete your account."
        )
      );
    }
  };

  const handleGoogle = async () => {
    setError("");

    try {
      await signUp.sso({
        strategy: "oauth_google",
        redirectCallbackUrl: "/sign-in/sso-callback",
        redirectUrl: "/",
      });
    } catch (err: any) {
      console.error("CLERK GOOGLE ERROR:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to continue with Google."
        )
      );
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="hidden bg-zinc-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            {/* LOGO */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-900">
                ✦
              </div>

              <span className="text-lg font-bold tracking-tight">
                Roomly AI
              </span>
            </div>

            {/* HERO TEXT */}
            <div className="mt-20 max-w-md">
              <h1 className="text-5xl font-bold leading-tight tracking-tight">
                Create your dream room with AI.
              </h1>

              <p className="mt-6 text-lg leading-8 text-zinc-400">
                Upload a photo of your room and transform it
                into a beautiful new space with AI-powered
                interior design.
              </p>
            </div>
          </div>

          {/* COPYRIGHT */}
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Roomly AI
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center px-5 py-12">
          <div className="w-full max-w-md">
            {/* MOBILE LOGO */}
            <div className="mb-10 flex items-center justify-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                ✦
              </div>

              <span className="text-lg font-bold tracking-tight">
                Roomly AI
              </span>
            </div>

            {/* SIGN UP CARD */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-8">
              {!verificationStep ? (
                <>
                  {/* HEADER */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight">
                      Create your account
                    </h2>

                    <p className="mt-2 text-sm text-zinc-500">
                      Start creating beautiful room designs
                      with AI.
                    </p>
                  </div>

                  {/* GOOGLE */}
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="font-bold">G</span>

                    {loading
                      ? "Connecting..."
                      : "Continue with Google"}
                  </button>

                  {/* DIVIDER */}
                  <div className="my-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-zinc-200" />

                    <span className="text-xs font-medium text-zinc-400">
                      OR
                    </span>

                    <div className="h-px flex-1 bg-zinc-200" />
                  </div>

                  {/* ERROR */}
                  {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* FULL NAME */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Full name
                    </label>

                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      placeholder="John Doe"
                      autoComplete="name"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5"
                    />
                  </div>

                  {/* EMAIL */}
                  <div className="mt-5">
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Email address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5"
                    />
                  </div>

                  {/* PASSWORD */}
                  <div className="mt-5">
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Password
                    </label>

                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="••••••••••••••••"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5"
                    />

                    <p className="mt-2 text-xs text-zinc-400">
                      Use at least 15 characters.
                    </p>
                  </div>

                  {/* CLERK CAPTCHA */}
                  <div
                    id="clerk-captcha"
                    data-cl-theme="light"
                    data-cl-size="flexible"
                    className="mt-4"
                  />

                  {/* CREATE ACCOUNT */}
                  <button
                    type="button"
                    onClick={handleSignUp}
                    disabled={loading}
                    className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Creating account..."
                      : "Create account"}
                  </button>

                  {/* SIGN IN */}
                  <p className="mt-6 text-center text-sm text-zinc-500">
                    Already have an account?{" "}

                    <Link
                      href="/sign-in"
                      className="font-semibold text-zinc-900 hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  {/* VERIFICATION HEADER */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight">
                      Verify your email
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      We sent a verification code to{" "}

                      <span className="font-medium text-zinc-900">
                        {email}
                      </span>
                      .
                    </p>
                  </div>

                  {/* ERROR */}
                  {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* VERIFICATION CODE */}
                  <label
                    htmlFor="code"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Verification code
                  </label>

                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value)
                    }
                    placeholder="123456"
                    autoComplete="one-time-code"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-lg tracking-[0.3em] outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5"
                  />

                  {/* VERIFY */}
                  <button
                    type="button"
                    onClick={handleVerification}
                    disabled={loading}
                    className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Verifying..."
                      : "Verify email"}
                  </button>
                </>
              )}
            </div>

            {/* TERMS */}
            <p className="mt-6 text-center text-xs leading-5 text-zinc-400">
              By creating an account, you agree to Roomly
              AI&apos;s{" "}

              <span className="text-zinc-500">
                Terms of Service
              </span>{" "}

              and{" "}

              <span className="text-zinc-500">
                Privacy Policy
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}