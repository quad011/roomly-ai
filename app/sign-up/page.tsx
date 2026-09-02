import Link from "next/link";

export default function SignUpPage() {
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
                Upload a photo of your room and transform it into a
                beautiful new space with AI-powered interior design.
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

              {/* TITLE */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight">
                  Create your account
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Start creating beautiful room designs with AI.
                </p>
              </div>

              {/* GOOGLE BUTTON */}
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                <span className="font-bold">
                  G
                </span>

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
                  placeholder="John Doe"
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
                  placeholder="you@example.com"
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
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5"
                />

                <p className="mt-2 text-xs text-zinc-400">
                  Use at least 8 characters.
                </p>
              </div>

              {/* CREATE ACCOUNT */}
              <button
                type="button"
                className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Create account
              </button>

              {/* SIGN IN */}
              <p className="mt-6 text-center text-sm text-zinc-500">
                Already have an account?{" "}

                <Link
                  href="/log-in"
                  className="font-semibold text-zinc-900 hover:underline"
                >
                  Log in
                </Link>
              </p>

            </div>

            {/* TERMS */}
            <p className="mt-6 text-center text-xs leading-5 text-zinc-400">
              By creating an account, you agree to Roomly AI&apos;s{" "}
              
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