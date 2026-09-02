"use client";

import { useRef, useState } from "react";
import {
  Download,
  ImagePlus,
  Lock,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import { styles } from "@/lib/demo";
import { ChevronDown } from "lucide-react";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);

  // =========================================================
  // PLAN
  // =========================================================

  // TESTING:
  // "free"      = 5 generations + 3 styles
  // "pro"       = 100 generations + 10 styles
  // "unlimited" = unlimited generations + all styles
  //
  // Kasnije ćemo ovo zameniti pravim user/subscription podatkom.
  const [currentPlan] = useState<"free" | "pro" | "unlimited">("unlimited");

  const planLimits = {
    free: {
      generations: 5,
      designs: 3,
    },
    pro: {
      generations: 100,
      designs: 10,
    },
    unlimited: {
      generations: Infinity,
      designs: Infinity,
    },
  };

  const currentLimits = planLimits[currentPlan];

  // =========================================================
  // GENERATOR STATE
  // =========================================================

  const [selected, setSelected] = useState(
    styles[0]?.id ?? "modern"
  );

  const [room, setRoom] = useState("Living Room");

  const [preserve, setPreserve] = useState(
    "Layout + windows + doors"
  );

  const [creativity, setCreativity] = useState("Balanced");

  const [additionalPrompt, setAdditionalPrompt] = useState("");

  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] = useState<string | null>(null);

  const [remaining, setRemaining] = useState(
    currentLimits.generations
  );

  const [results, setResults] = useState<string[]>([]);

  const [generating, setGenerating] = useState(false);

  const [toast, setToast] = useState("");

  // =========================================================
  // HELPERS
  // =========================================================

  function notify(message: string) {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 3000);
  }

  function isUnlimited() {
    return currentPlan === "unlimited";
  }

  function isStyleUnlocked(index: number) {
    if (currentPlan === "unlimited") {
      return true;
    }

    return index < currentLimits.designs;
  }

  // =========================================================
  // FILE UPLOAD
  // =========================================================

  function onFile(nextFile?: File) {
    if (!nextFile) {
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      notify("Please upload an image file.");
      return;
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      notify("Image must be smaller than 10 MB.");
      return;
    }

    setFile(nextFile);

    const objectUrl = URL.createObjectURL(nextFile);

    setPreview(objectUrl);

    setResults([]);
  }

  // =========================================================
  // GENERATE
  // =========================================================

  async function generate() {
    if (!file) {
      notify("Please upload a room image first.");
      return;
    }

    if (!isUnlimited() && remaining <= 0) {
      if (currentPlan === "free") {
        notify(
          "You've used all 5 free generations. Upgrade to Pro to continue."
        );
      } else {
        notify("You've used all 100 monthly generations.");
      }

      return;
    }

    setGenerating(true);
    setResults([]);

    try {
      const formData = new FormData();

      formData.append("image", file);
      formData.append("style", selected);
      formData.append("room", room);
      formData.append("preserve", preserve);
      formData.append("creativity", creativity);
      formData.append("additionalPrompt", additionalPrompt);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to generate the redesign."
        );
      }

      if (!Array.isArray(data.images)) {
        throw new Error("No generated images were returned.");
      }

      setResults(data.images);

      if (!isUnlimited()) {
        setRemaining((value) => Math.max(0, value - 1));
      }

      window.setTimeout(() => {
        document
          .getElementById("results")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (error) {
      console.error(error);

      notify(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating."
      );
    } finally {
      setGenerating(false);
    }
  }

  // =========================================================
  // DOWNLOAD
  // =========================================================

  async function downloadImage(
    imageUrl: string,
    index: number
  ) {
    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Download failed.");
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `roomly-redesign-${index + 1}.jpg`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);

      notify("Unable to download this image.");
    }
  }

  // =========================================================
  // SCROLL
  // =========================================================

  function scrollToGenerator() {
    document
      .getElementById("generator")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* =====================================================
          TOAST
      ====================================================== */}

      {toast && (
        <div className="fixed right-5 top-5 z-50 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <button
            type="button"
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <WandSparkles size={17} />
            </div>

            <span className="text-lg font-bold tracking-tight">
              Roomly AI
            </span>
          </button>

          <nav className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("pricing")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 sm:block"
            >
              Pricing
            </button>

            <button
              type="button"
              onClick={scrollToGenerator}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Try Roomly
            </button>
          </nav>
        </div>
      </header>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-700">
              <Sparkles size={14} />
              AI Interior Redesign
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl">
              Redesign your room with AI.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
              Upload a photo of your room and transform it into a
              beautiful new interior in seconds.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={scrollToGenerator}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                <WandSparkles size={17} />
                Start designing
              </button>

              <div className="rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm text-zinc-600">
                {isUnlimited()
                  ? "Unlimited generations"
                  : `${remaining} generations remaining`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          GENERATOR
      ====================================================== */}

      <section
        id="generator"
        className="border-b border-zinc-200 bg-zinc-50"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
              AI Generator
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Create your new room
            </h2>

            <p className="mt-2 max-w-2xl text-zinc-600">
              Upload your room, choose a style and let Roomly AI
              redesign it for you.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_50%]">
            {/* =================================================
                UPLOAD
            ================================================== */}

            <div className="lg:sticky lg:top-24 h-fit rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    Your room
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    JPG, PNG or WEBP · max 10 MB
                  </p>
                </div>

                <ImagePlus
                  size={20}
                  className="text-zinc-500"
                />
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  onFile(event.target.files?.[0]);

                  event.currentTarget.value = "";
                }}
              />

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={`group relative flex min-h-[420px] w-full overflow-hidden rounded-xl border-2 border-dashed transition ${
                  preview
                    ? "border-zinc-300 bg-zinc-50"
                    : "border-zinc-300 bg-zinc-50 hover:border-zinc-500 hover:bg-zinc-100"
                }`}
              >
                {preview ? (
                  <>
                    <img
                      src={preview}
                      alt="Uploaded room"
                      className="absolute inset-0 h-full w-full object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-left">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {file?.name}
                          </p>

                          <p className="mt-1 text-xs text-white/75">
                            Click to replace image
                          </p>
                        </div>

                        <Upload
                          size={18}
                          className="text-white"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="m-auto flex max-w-sm flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Upload
                        size={22}
                        className="text-zinc-700"
                      />
                    </div>

                    <p className="mt-5 font-semibold">
                      Upload a room photo
                    </p>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Choose a clear photo of your room to get
                      the best AI redesign.
                    </p>

                    <span className="mt-5 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white">
                      Choose image
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* =================================================
                SETTINGS
            ================================================== */}

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-6">
                <h3 className="font-semibold">
                  Design settings
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Customize your AI redesign.
                </p>
              </div>

              <div className="space-y-6">
                {/* ROOM */}

                <div>
                  <label
                    htmlFor="room"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Room
                  </label>

                  <div className="relative">
                    <select
                      id="room"
                      value={room}
                      onChange={(event) =>
                        setRoom(event.target.value)
                      }
                      className="w-full appearance-none rounded-xl outline-none border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm"
                    >
                      <option>Living Room</option>
                      <option>Bedroom</option>
                      <option>Kitchen</option>
                      <option>Dining Room</option>
                      <option>Office</option>
                      <option>Bathroom</option>
                      <option>Hallway</option>
                      <option>Other</option>
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                  </div>
                </div>

                {/* STYLE */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-semibold">
                      Design style
                    </label>

                    <span className="text-xs text-zinc-500">
                      {currentPlan === "free"
                        ? "3 styles included"
                        : currentPlan === "pro"
                          ? "10 styles included"
                          : "All styles unlocked"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4` lg:grid-cols-3 gap-3">
                    {styles.map((style, index) => {
                      const unlocked =
                        isStyleUnlocked(index);

                      return (
                        <button
                          key={style.id}
                          type="button"
                          disabled={!unlocked}
                          onClick={() => {
                            if (!unlocked) {
                              notify(
                                currentPlan === "free"
                                  ? "This design is available on Pro."
                                  : "Upgrade your plan to unlock this design."
                              );

                              return;
                            }

                            setSelected(style.id);
                          }}
                          className={`group overflow-hidden rounded-xl border text-left transition ${
                            selected === style.id
                              ? "border-zinc-900 ring-2 ring-zinc-900"
                              : unlocked
                                ? "border-zinc-200 hover:border-zinc-400"
                                : "cursor-not-allowed border-zinc-200 opacity-60"
                          }`}
                        >
                          <div className="relative h-20 overflow-hidden">
                            <img
                              src={style.image}
                              alt={style.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />

                            {!unlocked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
                                <Lock size={16} />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between px-3 py-2.5">
                            <span className="text-xs font-semibold">
                              {style.name}
                            </span>

                            {selected === style.id &&
                              unlocked && (
                                <span className="h-2 w-2 rounded-full bg-zinc-900" />
                              )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PRESERVE */}

                <div>
                  <label
                    htmlFor="preserve"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Keep room structure
                  </label>

                  <div className="relative">
                    <select
                      id="preserve"
                      value={preserve}
                      onChange={(event) =>
                        setPreserve(event.target.value)
                      }
                      className="w-full appearance-none rounded-xl outline-none border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm"
                    >
                      <option>
                        Layout + windows + doors
                      </option>
                      <option>
                        Layout + windows
                      </option>
                      <option>Windows + doors</option>
                      <option>Nothing</option>
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                  </div>
                </div>

                {/* CREATIVITY */}
                <div>
                  <label
                    htmlFor="creativity"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Creativity
                  </label>

                  <div className="relative">
                    <select
                      id="creativity"
                      value={creativity}
                      onChange={(event) =>
                        setCreativity(event.target.value)
                      }
                      className="w-full appearance-none rounded-xl outline-none border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm"
                    >
                      <option>Conservative</option>
                      <option>Balanced</option>
                      <option>Creative</option>
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                  </div>

                </div>
                
                {/* ADDITIONAL INSTRUCTIONS */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="additionalPrompt"
                      className="block text-sm font-semibold"
                    >
                      Additional instructions
                    </label>

                    <span className="text-xs text-zinc-400">
                      Optional
                    </span>
                  </div>

                  <textarea
                    id="additionalPrompt"
                    value={additionalPrompt}
                    onChange={(event) =>
                      setAdditionalPrompt(event.target.value)
                    }
                    placeholder="e.g. Add a 30-inch TV, put a bookshelf to the right of the TV, and add a TV console with a hi-fi system."
                    rows={4}
                    maxLength={500}
                    className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/5"
                  />

                  <div className="mt-1 flex justify-between text-xs text-zinc-400">
                    <span>
                      Tell AI exactly what you want to add or change.
                    </span>

                    <span>
                      {additionalPrompt.length}/500
                    </span>
                  </div>
                </div>

                {/* GENERATE */}

                <div className="border-t border-zinc-200 pt-6">
                  <button
                    type="button"
                    onClick={generate}
                    disabled={
                      generating ||
                      !file ||
                      (!isUnlimited() && remaining <= 0)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {generating ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={17} />
                        Generate redesign
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-center text-xs text-zinc-500">
                    {isUnlimited()
                      ? "Unlimited generations"
                      : `${remaining} generation${
                          remaining === 1 ? "" : "s"
                        } remaining`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          RESULTS
      ====================================================== */}

      <section
        id="results"
        className="border-b border-zinc-200"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
              Results
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Your redesigned room
            </h2>

            <p className="mt-2 text-zinc-600">
              Your AI-generated interior designs will appear
              here.
            </p>
          </div>

          {generating ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Sparkles
                    size={24}
                    className="animate-pulse text-zinc-700"
                  />
                </div>

                <h3 className="mt-5 font-semibold">
                  Redesigning your room...
                </h3>

                <p className="mt-2 text-sm text-zinc-500">
                  This can take a little while.
                </p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <ImagePlus
                    size={22}
                    className="text-zinc-500"
                  />
                </div>

                <h3 className="mt-5 font-semibold">
                  No designs yet
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Upload a room photo and generate your first
                  AI redesign.
                </p>

                <button
                  type="button"
                  onClick={scrollToGenerator}
                  className="mt-5 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Start designing
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                    <img
                      src={image}
                      alt={`AI redesigned room ${
                        index + 1
                      }`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        downloadImage(image, index)
                      }
                      className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-zinc-900 opacity-0 shadow-lg transition group-hover:opacity-100"
                      aria-label={`Download redesign ${
                        index + 1
                      }`}
                    >
                      <Download size={17} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {styles.find(
                          (style) => style.id === selected
                        )?.name ?? "AI Redesign"}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {room}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        downloadImage(image, index)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold transition hover:bg-zinc-50"
                    >
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          PRICING
      ====================================================== */}

      <section
        id="pricing"
        className="border-b border-zinc-200 bg-zinc-50"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
              Pricing
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Choose your plan
            </h2>

            <p className="mt-3 text-zinc-600">
              Start for free and upgrade when you need more
              designs.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {/* =================================================
                FREE
            ================================================== */}

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div>
                <h3 className="text-xl font-bold">Free</h3>

                <p className="mt-2 text-sm text-zinc-500">
                  Try Roomly AI for free.
                </p>
              </div>

              <div className="mt-6">
                <span className="text-4xl font-bold">
                  €0
                </span>

                <span className="text-sm text-zinc-500">
                  {" "}
                  forever
                </span>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-zinc-600">
                <li>✓ 5 AI room redesigns</li>
                <li>✓ 3 design styles</li>
                <li>✓ Standard image quality</li>
                <li>✓ Basic interior styles</li>
              </ul>

              <button
                type="button"
                onClick={scrollToGenerator}
                className="mt-8 w-full rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold transition hover:bg-zinc-50"
              >
                Current plan
              </button>
            </div>

            {/* =================================================
                PRO
            ================================================== */}

            <div className="relative rounded-2xl border-2 border-zinc-900 bg-white p-6 shadow-sm">
              <div className="absolute right-5 top-5 rounded-full bg-zinc-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Most popular
              </div>

              <div>
                <h3 className="text-xl font-bold">Pro</h3>

                <p className="mt-2 text-sm text-zinc-500">
                  For regular room redesigns.
                </p>
              </div>

              <div className="mt-6">
                <span className="text-4xl font-bold">
                  €9.99
                </span>

                <span className="text-sm text-zinc-500">
                  {" "}
                  / month
                </span>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-zinc-600">
                <li>✓ 100 AI room redesigns / month</li>
                <li>✓ 10 design styles</li>
                <li>✓ High-quality image generation</li>
                <li>✓ More interior styles</li>
              </ul>

              <button
                type="button"
                disabled
                className="mt-8 w-full cursor-not-allowed rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white opacity-50"
              >
                Payments coming soon
              </button>
            </div>

            {/* =================================================
                UNLIMITED
            ================================================== */}

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div>
                <h3 className="text-xl font-bold">
                  Unlimited
                </h3>

                <p className="mt-2 text-sm text-zinc-500">
                  For unlimited creative projects.
                </p>
              </div>

              <div className="mt-6">
                <span className="text-4xl font-bold">
                  €79.99
                </span>

                <span className="text-sm text-zinc-500">
                  {" "}
                  / year
                </span>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-zinc-600">
                <li>✓ Unlimited AI room redesigns / year</li>
                <li>✓ All design styles</li>
                <li>✓ High-quality image generation</li>
                <li>✓ All interior styles</li>
              </ul>

              <button
                type="button"
                disabled
                className="mt-8 w-full cursor-not-allowed rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold opacity-50"
              >
                Payments coming soon
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-zinc-500 sm:flex-row lg:px-8">
          <p>
            © {new Date().getFullYear()} Roomly AI
          </p>

          <p>
            AI-powered interior redesign.
          </p>
        </div>
      </footer>
    </main>
  );
}