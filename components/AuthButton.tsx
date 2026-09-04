"use client";

import {
  useAuth,
  useClerk,
} from "@clerk/nextjs";

export default function AuthButton() {
  const {
    isLoaded,
    isSignedIn,
  } = useAuth();

  const { signOut } = useClerk();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return (
      <button
        type="button"
        onClick={() =>
          signOut({
            redirectUrl: "/",
          })
        }
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        window.location.href =
          "/sign-in";
      }}
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-zinc-800"
    >
      Sign in
    </button>
  );
}