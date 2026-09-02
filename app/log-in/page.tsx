export default function SignInPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT */}
        <div className="hidden bg-zinc-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-900">
                ✦
              </div>

              <span className="text-lg font-bold tracking-tight">
                Roomly AI
              </span>
            </div>

            <div className="mt-20 max-w-md">
              <h1 className="text-5xl font-bold leading-tight tracking-tight">
                Redesign your room with AI.
              </h1>

              <p className="mt-6 text-lg leading-8 text-zinc-400">
                Transform your room into a space you love with
                realistic AI-powered interior redesigns.
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Roomly AI
          </p>
        </div>

        {/* RIGHT */}
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

            {/* LOGIN CARD */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-8">

              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Sign in to continue designing your rooms.
                </p>
              </div>

              {/* GOOGLE */}
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                <span className="font-bold">G</span>
                Continue with Google
              </button>

              {/* DIVIDER */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-zinc-200" />

                <span className="text-xs font-medium text-zinc-400">
                  OR
                </span>

                <div className="h-px flex-1 bg-zinc-200" />
              </div>

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5"
                />
              </div>

              {/* PASSWORD */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-medium text-zinc-500 transition hover:text-zinc-900"
                  >
                    Forgot password?
                  </button>
                </div>

                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5"
                />
              </div>

              {/* LOGIN */}
              <button
                type="button"
                className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Sign in
              </button>

              {/* SIGN UP */}
              <p className="mt-6 text-center text-sm text-zinc-500">
                Don't have an account?{" "}
                <a
                  href="/sign-up"
                  className="font-semibold text-zinc-900 hover:underline"
                >
                  Sign up
                </a>
              </p>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-zinc-400">
              By continuing, you agree to Roomly AI's Terms of
              Service and Privacy Policy.
            </p>

          </div>
        </div>

      </div>
    </main>
  );
}