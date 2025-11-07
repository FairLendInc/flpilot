"use client";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useState } from "react";

const INTRO_STYLE_ID = "faq1-animations";

const faqs = [
  {
    question: "What is FairLend?",
    answer:
      "FairLend is the MLS for private mortgages—an end‑to‑end exchange and automation platform where brokers originate with our MIC, investors buy fully‑managed, fractionalized mortgages, and servicing is automated from disbursal to default.",
    meta: "Overview",
  },
  {
    question: "How does the three‑layer model work?",
    answer:
      "Layer 1: Origination via the FairLend MIC with consistent capital and tools. Layer 2: Marketplace lists pre‑funded, pre‑vetted, fractionalized deals through white‑labeled investor portals. Layer 3: Servicing automates PAD payments, renewals, and collections.",
    meta: "Product",
  },
  {
    question: "Why is this \"MLS for brokers\"?",
    answer:
      "Brokers get a distribution rail and branded investor portals to list and place mortgages at scale—like MLS inventory, but for private mortgages with on‑rails compliance, funding, and servicing built‑in.",
    meta: "Brokers",
  },
  {
    question: "What do brokers earn?",
    answer:
      "A 0.5% trailer on their investors’ deployed capital in perpetuity, plus broker fees on MIC‑funded originations. It’s the only recurring passive income stream in private mortgages—and it compounds as investor AUM grows.",
    meta: "Brokers",
  },
  {
    question: "How do investors benefit?",
    answer:
      "Access pre‑funded, pre‑vetted, fractionalized mortgages with transparent valuations, full docs, and digital closings in minutes. Liquidity options reduce typical 12–24 month lockups to roughly 7–30 days via our compliant secondary market.",
    meta: "Investors",
  },
  {
    question: "Can Americans invest?",
    answer:
      "Yes. We distribute through white‑labeled portals offered to U.S. brokers and advisors. Compliance and suitability checks (KYC/AML) are automated during onboarding.",
    meta: "Distribution",
  },
  {
    question: "How are regulation and compliance handled?",
    answer:
      "Our MIC follows the standard OSC path. Distribution through licensed brokers/advisors keeps marketplace activity within FSRA guidelines. Automated KYC/AML and suitability run at onboarding, with legal and data‑protection oversight.",
    meta: "Compliance",
  },
  {
    question: "Where does AI fit?",
    answer:
      "A hybrid automation stack with human‑in‑the‑loop powers underwriting assistance, appraisal checks, risk monitoring, renewals, and collections. RLHF on real decisions creates a compounding data flywheel that improves accuracy and coverage.",
    meta: "AI",
  },
  {
    question: "How fast are closings and what about legal fees?",
    answer:
      "Our on‑rails digital workflow compresses closings from days to minutes. Standardized docs and process reduce legal fees from thousands to about $250 per transaction.",
    meta: "Operations",
  },
  {
    question: "What’s the capital velocity advantage?",
    answer:
      "The MIC originates, offloads to marketplace investors, then redeploys in 15–30 days—recycling capital 12–18× annually. That drives scale without being capital‑constrained.",
    meta: "Scale",
  },
  {
    question: "How does FairLend make money?",
    answer:
      "Standardized fees across the stack: 1% origination split with a listing fee, 1% monthly servicing, 1% renewal, ~1% secondary transactions, plus MIC performance carry over a hurdle. SaaS licensing is planned for adjacent markets.",
    meta: "Revenue",
  },
  {
    question: "What’s the moat?",
    answer:
      "Brokers earn trailers that lock in distribution, investors prefer instant, transparent closings, and borrowers stay for guaranteed renewals and fair terms. Combined with data flywheel and infra inertia, this creates durable network effects.",
    meta: "Defensibility",
  },
  {
    question: "Can MICs or others license the tech?",
    answer:
      "Yes. Components of the platform can be licensed (SaaS) to MICs and adjacent industries. The automation layer and data infrastructure are designed for extensibility and international distribution.",
    meta: "SaaS",
  },
  {
    question: "How does money flow through a deal?",
    answer:
      "Broker originates via MIC → mortgage is listed as fractionalized inventory → investor purchases through a white‑labeled portal → PAD servicing automates payments, renewals, and if needed, collections and recovery.",
    meta: "Flows",
  },
];

const palettes = {
  dark: {
    surface: "bg-neutral-950 text-neutral-100",
    panel: "bg-neutral-900/50",
    border: "border-white/10",
    heading: "text-white",
    muted: "text-neutral-400",
    iconRing: "border-white/20",
    iconSurface: "bg-white/5",
    icon: "text-white",
    toggle: "border-white/20 text-white",
    toggleSurface: "bg-white/10",
    glow: "rgba(255, 255, 255, 0.08)",
    aurora: "radial-gradient(ellipse 50% 100% at 10% 0%, rgba(226, 232, 240, 0.15), transparent 65%), #000000",
    shadow: "shadow-[0_36px_140px_-60px_rgba(10,10,10,0.95)]",
    overlay: "linear-gradient(130deg, rgba(255,255,255,0.04) 0%, transparent 65%)",
  },
  light: {
    surface: "bg-slate-100 text-neutral-900",
    panel: "bg-white/70",
    border: "border-neutral-200",
    heading: "text-neutral-900",
    muted: "text-neutral-600",
    iconRing: "border-neutral-300",
    iconSurface: "bg-neutral-900/5",
    icon: "text-neutral-900",
    toggle: "border-neutral-200 text-neutral-900",
    toggleSurface: "bg-white",
    glow: "rgba(15, 15, 15, 0.08)",
    aurora: "radial-gradient(ellipse 50% 100% at 10% 0%, rgba(15, 23, 42, 0.08), rgba(255, 255, 255, 0.95) 70%)",
    shadow: "shadow-[0_36px_120px_-70px_rgba(15,15,15,0.18)]",
    overlay: "linear-gradient(130deg, rgba(15,23,42,0.08) 0%, transparent 70%)",
  },
};

function FAQ1() {
  const { theme: themeValue, setTheme: setThemeValue, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);

  // Use resolvedTheme which handles "system" theme automatically
  const theme = useMemo(() => {
    if (!mounted) return "light";
    return resolvedTheme === "dark" ? "dark" : "light";
  }, [resolvedTheme, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(INTRO_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = INTRO_STYLE_ID;
    style.innerHTML = `
      @keyframes faq1-fade-up {
        0% { transform: translate3d(0, 20px, 0); opacity: 0; filter: blur(6px); }
        60% { filter: blur(0); }
        100% { transform: translate3d(0, 0, 0); opacity: 1; filter: blur(0); }
      }
      @keyframes faq1-beam-spin {
        0% { transform: rotate(0deg) scale(1); }
        100% { transform: rotate(360deg) scale(1); }
      }
      @keyframes faq1-pulse {
        0% { transform: scale(0.7); opacity: 0.55; }
        60% { opacity: 0.1; }
        100% { transform: scale(1.25); opacity: 0; }
      }
      @keyframes faq1-meter {
        0%, 20% { transform: scaleX(0); transform-origin: left; }
        45%, 60% { transform: scaleX(1); transform-origin: left; }
        80%, 100% { transform: scaleX(0); transform-origin: right; }
      }
      @keyframes faq1-tick {
        0%, 30% { transform: translateX(-6px); opacity: 0.4; }
        50% { transform: translateX(2px); opacity: 1; }
        100% { transform: translateX(20px); opacity: 0; }
      }
      .faq1-intro {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.85rem 1.4rem;
        border-radius: 9999px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(12, 12, 12, 0.42);
        color: rgba(248, 250, 252, 0.92);
        text-transform: uppercase;
        letter-spacing: 0.35em;
        font-size: 0.65rem;
        width: 100%;
        max-width: 24rem;
        margin: 0 auto;
        mix-blend-mode: screen;
        opacity: 0;
        transform: translate3d(0, 12px, 0);
        filter: blur(8px);
        transition: opacity 720ms ease, transform 720ms ease, filter 720ms ease;
        isolation: isolate;
      }
      .faq1-intro--light {
        border-color: rgba(17, 17, 17, 0.12);
        background: rgba(248, 250, 252, 0.88);
        color: rgba(15, 23, 42, 0.78);
        mix-blend-mode: multiply;
      }
      .faq1-intro--active {
        opacity: 1;
        transform: translate3d(0, 0, 0);
        filter: blur(0);
      }
      .faq1-intro__beam,
      .faq1-intro__pulse {
        position: absolute;
        inset: -110%;
        pointer-events: none;
        border-radius: 50%;
      }
      .faq1-intro__beam {
        background: conic-gradient(from 160deg, rgba(226, 232, 240, 0.25), transparent 32%, rgba(148, 163, 184, 0.22) 58%, transparent 78%, rgba(148, 163, 184, 0.18));
        animation: faq1-beam-spin 18s linear infinite;
        opacity: 0.55;
      }
      .faq1-intro--light .faq1-intro__beam {
        background: conic-gradient(from 180deg, rgba(15, 23, 42, 0.18), transparent 30%, rgba(71, 85, 105, 0.18) 58%, transparent 80%, rgba(15, 23, 42, 0.14));
      }
      .faq1-intro__pulse {
        border: 1px solid currentColor;
        opacity: 0.25;
        animation: faq1-pulse 3.4s ease-out infinite;
      }
      .faq1-intro__label {
        position: relative;
        z-index: 1;
        font-weight: 600;
        letter-spacing: 0.4em;
      }
      .faq1-intro__meter {
        position: relative;
        z-index: 1;
        flex: 1 1 auto;
        height: 1px;
        background: linear-gradient(90deg, transparent, currentColor 35%, transparent 85%);
        transform: scaleX(0);
        transform-origin: left;
        animation: faq1-meter 5.8s ease-in-out infinite;
        opacity: 0.7;
      }
      .faq1-intro__tick {
        position: relative;
        z-index: 1;
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 9999px;
        background: currentColor;
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
        animation: faq1-tick 3.2s ease-in-out infinite;
      }
      .faq1-intro--light .faq1-intro__tick {
        box-shadow: 0 0 0 4px rgba(15, 15, 15, 0.08);
      }
      .faq1-fade {
        opacity: 0;
        transform: translate3d(0, 24px, 0);
        filter: blur(12px);
        transition: opacity 700ms ease, transform 700ms ease, filter 700ms ease;
      }
      .faq1-fade--ready {
        animation: faq1-fade-up 860ms cubic-bezier(0.22, 0.68, 0, 1) forwards;
      }
    `;

    document.head.appendChild(style);

    return () => {
      if (style.parentNode) style.remove();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIntroReady(true);
      return;
    }
    const frame = window.requestAnimationFrame(() => setIntroReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);


  const palette = useMemo(() => palettes[theme], [theme]);

  const toggleTheme = () => {
    if (!mounted) return;
    const next = theme === "dark" ? "light" : "dark";
    setThemeValue(next);
  };
  const toggleQuestion = (index: number) => setActiveIndex((prev) => (prev === index ? -1 : index));

  useEffect(() => {
    if (typeof window === "undefined") {
      setHasEntered(true);
      return;
    }

    let timeout: number | undefined;
    const onLoad = () => {
      timeout = window.setTimeout(() => setHasEntered(true), 120);
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(timeout);
    };
  }, []);

  const setCardGlow = (event: React.MouseEvent<HTMLLIElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--faq-x", `${event.clientX - rect.left}px`);
    target.style.setProperty("--faq-y", `${event.clientY - rect.top}px`);
  };

  const clearCardGlow = (event: React.MouseEvent<HTMLLIElement>) => {
    const target = event.currentTarget;
    target.style.removeProperty("--faq-x");
    target.style.removeProperty("--faq-y");
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden transition-colors duration-700 ${palette.surface}`}>
      <div className="absolute inset-0 z-0" style={{ background: palette.aurora }} />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-80"
        style={{ background: palette.overlay, mixBlendMode: theme === "dark" ? "screen" : "multiply" }}
      />

      <section
        className={`relative z-10 mx-auto flex max-w-4xl flex-col gap-12 px-6 py-24 lg:max-w-5xl lg:px-12 ${
          hasEntered ? "faq1-fade--ready" : "faq1-fade"
        }`}
      >
        <div
          className={`faq1-intro ${introReady ? "faq1-intro--active" : ""} ${
            theme === "light" ? "faq1-intro--light" : "faq1-intro--dark"
          }`}
        >
          <span className="faq1-intro__beam" aria-hidden="true" />
          <span className="faq1-intro__pulse" aria-hidden="true" />
          <span className="faq1-intro__label">FairLend FAQ</span>
          <span className="faq1-intro__meter" aria-hidden="true" />
          <span className="faq1-intro__tick" aria-hidden="true" />
        </div>

        <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <p className={`text-xs uppercase tracking-[0.35em] ${palette.muted}`}>Questions</p>
            <h1 className={`text-4xl font-semibold leading-tight md:text-5xl ${palette.heading}`}>
              The MLS for Private Mortgages
            </h1>
            <p className={`max-w-xl text-base ${palette.muted}`}>
              Answers about FairLend’s marketplace, MIC, and AI‑driven automation for brokers and investors.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={`relative inline-flex h-11 items-center gap-3 rounded-full border px-5 text-sm font-medium transition-colors duration-500 ${palette.toggleSurface} ${palette.toggle}`}
            aria-pressed={theme === "dark" ? "true" : "false"}
          >
            <span className="relative flex h-6 w-6 items-center justify-center">
              <span
                className={`pointer-events-none absolute inset-0 rounded-full border opacity-40 ${
                  theme === "dark" ? "border-white/30 animate-pulse" : "border-neutral-400/50"
                }`}
              />
              <span
                className={`h-3 w-3 rounded-full transition-all duration-500 ${
                  theme === "dark" ? "bg-white" : "bg-neutral-900"
                }`}
              />
            </span>
            {theme === "dark" ? "Night" : "Day"} mode
          </button>
        </header>

        <ul className="space-y-4">
          {faqs.map((item, index) => {
            const open = activeIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-trigger-${index}`;

            return (
              <li
                key={item.question}
                className={`group relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-500 hover:-translate-y-0.5 focus-within:-translate-y-0.5 ${palette.border} ${palette.panel} ${palette.shadow}`}
                onMouseMove={setCardGlow}
                onMouseLeave={clearCardGlow}
              >
                <div
                  className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
                    open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  style={{
                    background: `radial-gradient(240px circle at var(--faq-x, 50%) var(--faq-y, 50%), ${palette.glow}, transparent 70%)`,
                  }}
                />

                <button
                  type="button"
                  id={buttonId}
                  aria-controls={panelId}
                  aria-expanded={open}
                  onClick={() => toggleQuestion(index)}
                  style={
                    {
                      "--faq-outline": theme === "dark" ? "rgba(255,255,255,0.35)" : "rgba(17,17,17,0.25)",
                    } as React.CSSProperties
                  }
                  className="relative flex w-full items-start gap-6 px-8 py-7 text-left transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--faq-outline)]"
                >
                  <span
                    className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all duration-500 group-hover:scale-105 ${palette.iconRing} ${palette.iconSurface}`}
                  >
                    <span
                      className={`pointer-events-none absolute inset-0 rounded-full border opacity-30 ${
                        palette.iconRing
                      } ${open ? "animate-ping" : ""}`}
                    />
                    <svg
                      className={`relative h-5 w-5 transition-transform duration-500 ${palette.icon} ${open ? "rotate-45" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>

                  <div className="flex flex-1 flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <h2 className={`text-lg font-medium leading-tight sm:text-xl ${palette.heading}`}>
                        {item.question}
                      </h2>
                      {item.meta && (
                        <span
                          className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.35em] transition-opacity duration-300 sm:ml-auto ${palette.border} ${palette.muted}`}
                        >
                          {item.meta}
                        </span>
                      )}
                    </div>

                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className={`overflow-hidden text-sm leading-relaxed transition-[max-height] duration-500 ease-out ${
                        open ? "max-h-64" : "max-h-0"
                      } ${palette.muted}`}
                    >
                      <p className="pr-2">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export default FAQ1;
export { FAQ1 };
