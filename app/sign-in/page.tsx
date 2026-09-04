"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth, useSignIn } from "@clerk/nextjs";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signIn, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signInCode, setSignInCode] = useState("");

  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [forgotPassword, setForgotPassword] = useState(false);
  const [signInVerificationStep, setSignInVerificationStep] =
    useState(false);
  const [resetStep, setResetStep] = useState(false);
  const [newPasswordStep, setNewPasswordStep] = useState(false);

  const loading = fetchStatus === "fetching";

  /*
   * If the user is already signed in,
   * don't show the sign-in page.
   */
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.href = "/";
    }
  }, [isLoaded, isSignedIn]);

  const getErrorMessage = (err: any, fallback: string) => {
    return (
      err?.errors?.[0]?.longMessage ||
      err?.errors?.[0]?.message ||
      err?.longMessage ||
      err?.message ||
      fallback
    );
  };

  /*
   * EMAIL + PASSWORD SIGN IN
   */
  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const { error: signInError } = await signIn.password({
        identifier: email.trim(),
        password,
      });

      if (signInError) {
        setError(
          signInError.longMessage ||
            signInError.message ||
            "Unable to sign in. Please check your credentials."
        );
        return;
      }

      /*
       * IMPORTANT:
       * signIn.create() does NOT return status.
       * The current status is available on signIn.status.
       */
      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/");

            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              window.location.href = url;
            }
          },
        });

        if (finalizeError) {
          setError(
            finalizeError.longMessage ||
              finalizeError.message ||
              "Unable to complete sign in."
          );
        }

        return;
      }

      /*
       * EMAIL MFA / SECOND FACTOR
       */
      if (signIn.status === "needs_second_factor") {
        const emailCodeFactor = signIn.supportedSecondFactors?.find(
          (factor: any) => factor.strategy === "email_code"
        );

        if (emailCodeFactor) {
          const { error: mfaError } =
            await signIn.mfa.sendEmailCode();

          if (mfaError) {
            setError(
              mfaError.longMessage ||
                mfaError.message ||
                "Unable to send verification code."
            );
            return;
          }

          setSignInVerificationStep(true);
          setSuccess(
            "A verification code has been sent to your email."
          );

          return;
        }

        setError(
          "Your account requires additional verification."
        );

        return;
      }

      /*
       * DEVICE TRUST
       */
      if (signIn.status === "needs_client_trust") {
        const emailCodeFactor = signIn.supportedSecondFactors?.find(
          (factor: any) => factor.strategy === "email_code"
        );

        if (emailCodeFactor) {
          const { error: mfaError } =
            await signIn.mfa.sendEmailCode();

          if (mfaError) {
            setError(
              mfaError.longMessage ||
                mfaError.message ||
                "Unable to send verification code."
            );
            return;
          }

          setSignInVerificationStep(true);
          setSuccess(
            "A verification code has been sent to your email."
          );

          return;
        }

        setError(
          "This device requires additional verification."
        );

        return;
      }

      /*
       * NEW PASSWORD REQUIRED
       */
      if (signIn.status === "needs_new_password") {
        setError(
          "You need to set a new password before signing in."
        );

        return;
      }

      /*
       * Anything else
       */
      setError(
        `Sign-in is not complete. Current status: ${
          signIn.status ?? "unknown"
        }`
      );
    } catch (err: any) {
      console.error("CLERK SIGN IN ERROR:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to sign in. Please check your credentials."
        )
      );
    }
  };

  /*
   * VERIFY SIGN-IN MFA CODE
   */
  const handleVerifySignInCode = async () => {
    if (!signInCode.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const { error: verificationError } =
        await signIn.mfa.verifyEmailCode({
          code: signInCode.trim(),
        });

      if (verificationError) {
        setError(
          verificationError.longMessage ||
            verificationError.message ||
            "Invalid verification code."
        );
        return;
      }

      if (signIn.status === "complete") {
        const { error: finalizeError } =
          await signIn.finalize({
            navigate: ({ decorateUrl }) => {
              const url = decorateUrl("/");

              if (url.startsWith("http")) {
                window.location.href = url;
              } else {
                window.location.href = url;
              }
            },
          });

        if (finalizeError) {
          setError(
            finalizeError.longMessage ||
              finalizeError.message ||
              "Unable to complete sign in."
          );
        }

        return;
      }

      setError(
        `Verification completed, but sign-in is not complete. Status: ${
          signIn.status ?? "unknown"
        }`
      );
    } catch (err: any) {
      console.error("CLERK MFA ERROR:", err);

      setError(
        getErrorMessage(
          err,
          "Invalid verification code."
        )
      );
    }
  };

  /*
   * GOOGLE SIGN IN
   */
  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      console.error("GOOGLE SIGN IN ERROR:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to continue with Google."
        )
      );
    }
  };

  /*
   * FORGOT PASSWORD - SEND CODE
   */
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      /*
       * Create a sign-in attempt with the email first.
       */
      const { error: createError } = await signIn.create({
        identifier: email.trim(),
      });

      if (createError) {
        setError(
          createError.longMessage ||
            createError.message ||
            "Unable to find an account with this email."
        );
        return;
      }

      /*
       * Send password reset email code.
       */
      const { error: resetError } =
        await signIn.resetPasswordEmailCode.sendCode();

      if (resetError) {
        setError(
          resetError.longMessage ||
            resetError.message ||
            "Unable to send password reset code."
        );
        return;
      }

      setResetStep(true);
      setSuccess(
        "A password reset code has been sent to your email."
      );
    } catch (err: any) {
      console.error("PASSWORD RESET ERROR:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to start password reset."
        )
      );
    }
  };

  /*
   * VERIFY PASSWORD RESET CODE
   */
  const handleVerifyResetCode = async () => {
    if (!resetCode.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const { error: verificationError } =
        await signIn.resetPasswordEmailCode.verifyCode({
          code: resetCode.trim(),
        });

      if (verificationError) {
        setError(
          verificationError.longMessage ||
            verificationError.message ||
            "Invalid verification code."
        );
        return;
      }

      setResetStep(false);
      setNewPasswordStep(true);
      setSuccess(
        "Code verified. Please choose a new password."
      );
    } catch (err: any) {
      console.error("RESET CODE ERROR:", err);

      setError(
        getErrorMessage(
          err,
          "Invalid verification code."
        )
      );
    }
  };

  /*
   * SUBMIT NEW PASSWORD
   */
  const handleResetPassword = async () => {
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 15) {
      setError(
        "Password must be at least 15 characters long."
      );
      return;
    }

    setError("");
    setSuccess("");

    try {
      const { error: resetError } =
        await signIn.resetPasswordEmailCode.submitPassword({
          password: newPassword,
        });

      if (resetError) {
        setError(
          resetError.longMessage ||
            resetError.message ||
            "Unable to reset your password."
        );
        return;
      }

      /*
       * Password reset moves the sign-in status to complete.
       */
      if (signIn.status === "complete") {
        const { error: finalizeError } =
          await signIn.finalize({
            navigate: ({ decorateUrl }) => {
              const url = decorateUrl("/");

              if (url.startsWith("http")) {
                window.location.href = url;
              } else {
                window.location.href = url;
              }
            },
          });

        if (finalizeError) {
          setError(
            finalizeError.longMessage ||
              finalizeError.message ||
              "Unable to complete sign in."
          );
        }

        return;
      }

      setSuccess(
        "Your password has been reset. You can now sign in."
      );

      setForgotPassword(false);
      setNewPasswordStep(false);
      setResetStep(false);
      setResetCode("");
      setNewPassword("");
      setPassword("");
    } catch (err: any) {
      console.error("RESET PASSWORD ERROR:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to reset your password."
        )
      );
    }
  };

  /*
   * RESET EVERYTHING
   */
  const backToSignIn = async () => {
    setError("");
    setSuccess("");

    setForgotPassword(false);
    setSignInVerificationStep(false);
    setResetStep(false);
    setNewPasswordStep(false);

    setSignInCode("");
    setResetCode("");
    setNewPassword("");

    try {
      await signIn.reset();
    } catch {
      // Nothing to do here.
    }
  };

  /*
   * Don't render login while Clerk is checking the session.
   */
  if (!isLoaded) {
    return null;
  }

  /*
   * Already authenticated -> redirect to home.
   */
  if (isSignedIn) {
    return null;
  }

  /*
   * MAIN UI
   */
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <div>
              <Link
                href="/"
                className="text-xl font-semibold tracking-tight"
              >
                Roomly AI
              </Link>
            </div>

            <div className="max-w-xl">
              <p className="mb-6 text-sm font-medium uppercase tracking-[0.25em] text-neutral-400">
                AI Interior Design
              </p>

              <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight xl:text-6xl">
                Transform your space with AI.
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-neutral-400">
                Upload a photo of your room and create
                realistic interior design concepts in seconds.
              </p>
            </div>

            <div className="text-sm text-neutral-500">
              © {new Date().getFullYear()} Roomly AI
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 text-black sm:px-10">
          <div className="w-full max-w-md">
            {/* LOGO MOBILE */}
            <div className="mb-10 lg:hidden">
              <Link
                href="/"
                className="text-xl font-semibold tracking-tight"
              >
                Roomly AI
              </Link>
            </div>

            {/* NORMAL SIGN IN */}
            {!forgotPassword &&
              !signInVerificationStep && (
                <>
                  <div className="mb-8">
                    <h2 className="text-3xl font-semibold tracking-tight">
                      Welcome back
                    </h2>

                    <p className="mt-2 text-sm text-neutral-500">
                      Sign in to continue to Roomly AI.
                    </p>
                  </div>

                  {/* GOOGLE */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white text-sm font-medium transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.27-2.09 3.57-5.17 3.57-8.64Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.87-3c-1.07.72-2.44 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.09A12 12 0 0 0 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.25 14.28A7.23 7.23 0 0 1 4.87 12c0-.79.14-1.56.38-2.28V6.63H1.25A12 12 0 0 0 0 12c0 1.93.46 3.76 1.25 5.37l4-3.09Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.76 0 3.34.61 4.59 1.81l3.44-3.44C17.95 1.08 15.24 0 12 0A12 12 0 0 0 1.25 6.63l4 3.09C6.2 6.87 8.86 4.75 12 4.75Z"
                      />
                    </svg>

                    Continue with Google
                  </button>

                  {/* DIVIDER */}
                  <div className="my-7 flex items-center gap-4">
                    <div className="h-px flex-1 bg-neutral-200" />

                    <span className="text-xs uppercase tracking-wider text-neutral-400">
                      or
                    </span>

                    <div className="h-px flex-1 bg-neutral-200" />
                  </div>

                  {/* EMAIL */}
                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium"
                      >
                        Email
                      </label>

                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        placeholder="you@example.com"
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black"
                      />
                    </div>

                    {/* PASSWORD */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium"
                        >
                          Password
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setForgotPassword(true);
                            setError("");
                            setSuccess("");
                          }}
                          className="text-sm text-neutral-500 transition hover:text-black"
                        >
                          Forgot password?
                        </button>
                      </div>

                      <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        placeholder="•••••••••••••••"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSignIn();
                          }
                        }}
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black"
                      />
                    </div>

                    {/* ERROR */}
                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    {/* SUCCESS */}
                    {success && (
                      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {success}
                      </div>
                    )}

                    {/* SUBMIT */}
                    <button
                      type="button"
                      onClick={handleSignIn}
                      disabled={loading}
                      className="h-12 w-full rounded-xl bg-black text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Signing in..." : "Sign in"}
                    </button>
                  </div>

                  {/* SIGN UP */}
                  <p className="mt-8 text-center text-sm text-neutral-500">
                    Don't have an account?{" "}
                    <Link
                      href="/sign-up"
                      className="font-medium text-black hover:underline"
                    >
                      Create account
                    </Link>
                  </p>

                  <p className="mt-8 text-center text-xs leading-5 text-neutral-400">
                    By continuing, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="underline hover:text-black"
                    >
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="underline hover:text-black"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </>
              )}

            {/* SIGN IN VERIFICATION */}
            {signInVerificationStep && (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Verify your sign in
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Enter the verification code we sent to
                    your email.
                  </p>
                </div>

                {success && (
                  <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

                {error && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="signInCode"
                      className="mb-2 block text-sm font-medium"
                    >
                      Verification code
                    </label>

                    <input
                      id="signInCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={signInCode}
                      onChange={(e) =>
                        setSignInCode(e.target.value)
                      }
                      placeholder="Enter code"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleVerifySignInCode();
                        }
                      }}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm tracking-[0.25em] outline-none transition placeholder:tracking-normal placeholder:text-neutral-400 focus:border-black"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifySignInCode}
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-black text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Verifying..."
                      : "Verify and continue"}
                  </button>

                  <button
                    type="button"
                    onClick={backToSignIn}
                    className="h-12 w-full rounded-xl border border-neutral-200 text-sm font-medium transition hover:bg-neutral-50"
                  >
                    Back to sign in
                  </button>
                </div>
              </>
            )}

            {/* FORGOT PASSWORD */}
            {forgotPassword && !resetStep && !newPasswordStep && (
              <>
                <div className="mb-8">
                  <button
                    type="button"
                    onClick={backToSignIn}
                    className="mb-6 text-sm text-neutral-500 hover:text-black"
                  >
                    ← Back to sign in
                  </button>

                  <h2 className="text-3xl font-semibold tracking-tight">
                    Forgot password?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Enter your email and we'll send you a
                    verification code to reset your password.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="forgotEmail"
                      className="mb-2 block text-sm font-medium"
                    >
                      Email
                    </label>

                    <input
                      id="forgotEmail"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="you@example.com"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleForgotPassword();
                        }
                      }}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-black text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Sending..."
                      : "Send reset code"}
                  </button>
                </div>
              </>
            )}

            {/* RESET CODE */}
            {forgotPassword && resetStep && (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Check your email
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Enter the verification code sent to{" "}
                    <span className="font-medium text-black">
                      {email}
                    </span>
                    .
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="resetCode"
                      className="mb-2 block text-sm font-medium"
                    >
                      Verification code
                    </label>

                    <input
                      id="resetCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={resetCode}
                      onChange={(e) =>
                        setResetCode(e.target.value)
                      }
                      placeholder="Enter code"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleVerifyResetCode();
                        }
                      }}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm tracking-[0.25em] outline-none transition placeholder:tracking-normal placeholder:text-neutral-400 focus:border-black"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyResetCode}
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-black text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Verifying..."
                      : "Verify code"}
                  </button>

                  <button
                    type="button"
                    onClick={backToSignIn}
                    className="h-12 w-full rounded-xl border border-neutral-200 text-sm font-medium transition hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* NEW PASSWORD */}
            {forgotPassword && newPasswordStep && (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Create new password
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Choose a new password for your Roomly AI
                    account.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="mb-2 block text-sm font-medium"
                    >
                      New password
                    </label>

                    <input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                      placeholder="At least 15 characters"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleResetPassword();
                        }
                      }}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black"
                    />
                  </div>

                  <p className="text-xs leading-5 text-neutral-400">
                    Your password must be at least 15
                    characters long.
                  </p>

                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-black text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Updating..."
                      : "Set new password"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}