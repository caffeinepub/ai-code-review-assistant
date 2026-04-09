import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Bug,
  CheckCircle,
  ChevronDown,
  Clock,
  Code2,
  Cpu,
  GitBranch,
  Globe,
  Layers,
  MessageSquare,
  Puzzle,
  Server,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SlideRef {
  id: string;
  label: string;
  ref: React.RefObject<HTMLElement | null>;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useIntersectionObserver(refs: React.RefObject<HTMLElement | null>[]) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observers = refs.map((ref, index) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIndex(index);
        },
        { threshold: 0.4 },
      );
      if (ref.current) observer.observe(ref.current);
      return observer;
    });
    return () => {
      for (const o of observers) o.disconnect();
    };
  }, [refs]);

  return activeIndex;
}

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("revealed");
        }
      },
      { threshold: 0.15 },
    );
    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  }, []);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 4,
    duration: Math.random() * 6 + 6,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: "oklch(0.75 0.15 190)",
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

function SlideDots({
  slides,
  activeIndex,
}: { slides: SlideRef[]; activeIndex: number }) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 h-14"
      style={{
        background: "oklch(0.12 0.02 260 / 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid oklch(0.3 0.02 260)",
      }}
      data-ocid="pres-nav"
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{
            background: "oklch(0.75 0.15 190 / 0.2)",
            border: "1px solid oklch(0.75 0.15 190 / 0.4)",
          }}
        >
          <Code2
            className="w-4 h-4"
            style={{ color: "oklch(0.75 0.15 190)" }}
          />
        </div>
        <span
          className="hidden sm:block text-sm font-semibold"
          style={{
            fontFamily: "var(--font-display)",
            color: "oklch(0.9 0.01 260)",
          }}
        >
          AI Code Review
        </span>
      </div>

      <div
        className="flex items-center gap-1.5"
        role="tablist"
        aria-label="Slide navigation"
      >
        {slides.map((slide, i) => (
          <button
            type="button"
            key={slide.id}
            role="tab"
            aria-selected={activeIndex === i}
            aria-label={`Go to slide: ${slide.label}`}
            data-ocid={`nav-dot-${i}`}
            onClick={() =>
              slide.ref.current?.scrollIntoView({ behavior: "smooth" })
            }
            title={slide.label}
            className="transition-all duration-300"
            style={{
              width: activeIndex === i ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background:
                activeIndex === i
                  ? "oklch(0.75 0.15 190)"
                  : "oklch(0.4 0.02 260)",
              border: "none",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      <Link
        to="/"
        className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all duration-200 hover:opacity-80"
        style={{
          background: "oklch(0.75 0.15 190 / 0.15)",
          color: "oklch(0.75 0.15 190)",
          border: "1px solid oklch(0.75 0.15 190 / 0.3)",
        }}
        data-ocid="nav-back-to-app"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to App
      </Link>
    </nav>
  );
}

function SlideHeading({
  label,
  title,
  subtitle,
}: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="reveal text-center mb-10 sm:mb-14">
      <span
        className="inline-block text-xs font-semibold tracking-widest uppercase mb-3 px-3 py-1 rounded-full"
        style={{
          background: "oklch(0.75 0.15 190 / 0.15)",
          color: "oklch(0.75 0.15 190)",
          border: "1px solid oklch(0.75 0.15 190 / 0.3)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {label}
      </span>
      <h2
        className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3"
        style={{
          fontFamily: "var(--font-display)",
          color: "oklch(0.95 0.01 260)",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="text-base sm:text-lg max-w-2xl mx-auto"
          style={{
            color: "oklch(0.6 0.01 260)",
            fontFamily: "var(--font-body)",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Slides ───────────────────────────────────────────────────────────────────

function TitleSlide({ sRef }: { sRef: React.RefObject<HTMLElement | null> }) {
  return (
    <section
      ref={sRef as React.RefObject<HTMLElement>}
      id="title"
      className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.1 0.02 260) 0%, oklch(0.14 0.025 240) 50%, oklch(0.12 0.03 200) 100%)",
      }}
    >
      <FloatingParticles />

      {/* Glow orb */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.75 0.15 190), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            background: "oklch(0.75 0.15 190 / 0.15)",
            color: "oklch(0.75 0.15 190)",
            border: "1px solid oklch(0.75 0.15 190 / 0.35)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <Star className="w-3 h-3" />
          B.Tech Final Year Project
        </div>

        {/* Title */}
        <h1
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-4 leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: "oklch(0.97 0.005 260)",
          }}
        >
          <span style={{ color: "oklch(0.75 0.15 190)" }}>AI</span> Code Review
          <br />
          <span style={{ color: "oklch(0.85 0.01 260)" }}>Assistant</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto"
          style={{
            color: "oklch(0.65 0.01 260)",
            fontFamily: "var(--font-body)",
          }}
        >
          Intelligent Code Analysis Powered by Google Gemini
        </p>

        {/* Meta info */}
        <div
          className="flex flex-wrap justify-center gap-4 mb-10 text-sm"
          style={{
            color: "oklch(0.5 0.01 260)",
            fontFamily: "var(--font-body)",
          }}
        >
          <span className="flex items-center gap-1.5">
            <Layers
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.75 0.15 190)" }}
            />
            Computer Science Department
          </span>
          <span className="flex items-center gap-1.5">
            <Star
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.75 0.15 190)" }}
            />
            {new Date().getFullYear()}
          </span>
        </div>

        {/* CTA */}
        <Link
          to="/"
          data-ocid="title-cta"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.7 0.15 190), oklch(0.55 0.18 205))",
            color: "oklch(0.12 0.02 260)",
            fontFamily: "var(--font-display)",
            boxShadow: "0 0 32px oklch(0.75 0.15 190 / 0.4)",
          }}
        >
          <Zap className="w-4 h-4" />
          View Live Demo
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50">
        <span
          className="text-xs tracking-widest uppercase"
          style={{
            color: "oklch(0.5 0.01 260)",
            fontFamily: "var(--font-mono)",
          }}
        >
          scroll
        </span>
        <ChevronDown
          className="w-4 h-4 animate-bounce"
          style={{ color: "oklch(0.5 0.01 260)" }}
        />
      </div>
    </section>
  );
}

const problems = [
  {
    icon: Clock,
    title: "Manual Review is Time-Consuming",
    desc: "Developers spend up to 20% of their time reviewing code, slowing down delivery and innovation.",
    accent: "oklch(0.7 0.18 35)",
  },
  {
    icon: AlertTriangle,
    title: "Knowledge Gaps in Best Practices",
    desc: "Junior developers lack instant access to expert guidance, leading to suboptimal code patterns.",
    accent: "oklch(0.7 0.15 85)",
  },
  {
    icon: GitBranch,
    title: "No Instant Feedback Loop",
    desc: "Waiting hours or days for peer review slows down the development cycle and learning.",
    accent: "oklch(0.65 0.2 25)",
  },
];

function ProblemSlide({ sRef }: { sRef: React.RefObject<HTMLElement | null> }) {
  return (
    <section
      ref={sRef as React.RefObject<HTMLElement>}
      id="problem"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-24"
      style={{ background: "oklch(0.11 0.015 260)" }}
    >
      <div className="w-full max-w-5xl mx-auto">
        <SlideHeading
          label="01 — Problem"
          title="The Challenge"
          subtitle="Why traditional code review falls short in modern development"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div
              key={p.title}
              className="reveal rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "oklch(0.155 0.018 260)",
                border: `1px solid ${p.accent}30`,
                animationDelay: `${i * 0.12}s`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: `${p.accent}18`,
                  border: `1px solid ${p.accent}40`,
                }}
              >
                <p.icon className="w-6 h-6" style={{ color: p.accent }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "oklch(0.93 0.01 260)",
                }}
              >
                {p.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: "oklch(0.58 0.01 260)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const pillars = [
  {
    icon: Zap,
    label: "Instant Analysis",
    desc: "Zero wait time — results in under 2 seconds",
  },
  {
    icon: Globe,
    label: "Multi-Language",
    desc: "20+ programming languages supported",
  },
  {
    icon: Brain,
    label: "AI-Powered",
    desc: "Google Gemini backend for deep understanding",
  },
  {
    icon: MessageSquare,
    label: "Detailed Feedback",
    desc: "Categorized, actionable insights every time",
  },
];

function SolutionSlide({
  sRef,
}: { sRef: React.RefObject<HTMLElement | null> }) {
  return (
    <section
      ref={sRef as React.RefObject<HTMLElement>}
      id="solution"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-24"
      style={{ background: "oklch(0.13 0.02 250)" }}
    >
      <div className="w-full max-w-5xl mx-auto">
        <SlideHeading label="02 — Solution" title="Our Solution" />

        {/* Central statement */}
        <div
          className="reveal rounded-2xl p-6 sm:p-8 mb-10 text-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.75 0.15 190 / 0.12), oklch(0.55 0.18 220 / 0.08))",
            border: "1px solid oklch(0.75 0.15 190 / 0.3)",
          }}
        >
          <p
            className="text-xl sm:text-2xl font-semibold leading-relaxed"
            style={{
              fontFamily: "var(--font-display)",
              color: "oklch(0.9 0.01 260)",
            }}
          >
            An AI-powered code review assistant that provides{" "}
            <span style={{ color: "oklch(0.75 0.15 190)" }}>
              instant, intelligent feedback
            </span>{" "}
            on any code snippet — in any language, for any developer.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pillars.map((p, i) => (
            <div
              key={p.label}
              className="reveal rounded-xl p-5 text-center transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "oklch(0.16 0.018 260)",
                border: "1px solid oklch(0.28 0.02 260)",
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                style={{
                  background: "oklch(0.75 0.15 190 / 0.15)",
                  border: "1px solid oklch(0.75 0.15 190 / 0.3)",
                }}
              >
                <p.icon
                  className="w-5 h-5"
                  style={{ color: "oklch(0.75 0.15 190)" }}
                />
              </div>
              <h3
                className="text-sm font-bold mb-1"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "oklch(0.9 0.01 260)",
                }}
              >
                {p.label}
              </h3>
              <p
                className="text-xs"
                style={{
                  color: "oklch(0.55 0.01 260)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Bug,
    title: "Bug Detection",
    desc: "Identifies bugs with severity ratings: High, Medium, and Low priority flags.",
    color: "oklch(0.65 0.2 25)",
  },
  {
    icon: TrendingUp,
    title: "Code Improvements",
    desc: "Actionable refactoring suggestions to improve readability and performance.",
    color: "oklch(0.75 0.15 190)",
  },
  {
    icon: MessageSquare,
    title: "Plain-English Explanations",
    desc: "Understand what your code does in clear, jargon-free language.",
    color: "oklch(0.7 0.15 85)",
  },
  {
    icon: Shield,
    title: "Best Practices",
    desc: "Language-specific coding standards and security recommendations.",
    color: "oklch(0.65 0.18 145)",
  },
  {
    icon: Star,
    title: "Quality Score",
    desc: "Color-coded score (green/yellow/red) with a circular progress indicator.",
    color: "oklch(0.7 0.18 35)",
  },
  {
    icon: Globe,
    title: "20+ Languages",
    desc: "JavaScript, Python, Java, C++, Go, Rust, TypeScript, and many more.",
    color: "oklch(0.65 0.15 280)",
  },
];

function FeaturesSlide({
  sRef,
}: { sRef: React.RefObject<HTMLElement | null> }) {
  return (
    <section
      ref={sRef as React.RefObject<HTMLElement>}
      id="features"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-24"
      style={{ background: "oklch(0.11 0.015 260)" }}
    >
      <div className="w-full max-w-5xl mx-auto">
        <SlideHeading
          label="03 — Features"
          title="Key Features"
          subtitle="Everything you need for comprehensive code analysis"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="reveal group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-default"
              style={{
                background: "oklch(0.155 0.018 260)",
                border: `1px solid ${f.color}25`,
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110"
                style={{
                  background: `${f.color}18`,
                  border: `1px solid ${f.color}40`,
                }}
              >
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <h3
                className="text-sm font-bold mb-1.5"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "oklch(0.93 0.01 260)",
                }}
              >
                {f.title}
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{
                  color: "oklch(0.55 0.01 260)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const frontendStack = [
  {
    label: "React 19 + TypeScript",
    icon: Code2,
    color: "oklch(0.65 0.15 195)",
  },
  { label: "Tailwind CSS", icon: Layers, color: "oklch(0.65 0.15 210)" },
  {
    label: "TanStack Router & Query",
    icon: GitBranch,
    color: "oklch(0.7 0.15 85)",
  },
  { label: "OKLCH Color System", icon: Star, color: "oklch(0.7 0.18 35)" },
];
const backendStack = [
  {
    label: "Motoko (Internet Computer)",
    icon: Server,
    color: "oklch(0.65 0.2 25)",
  },
  { label: "Google Gemini AI API", icon: Brain, color: "oklch(0.65 0.18 145)" },
  { label: "HTTP Outcalls", icon: Globe, color: "oklch(0.75 0.15 190)" },
  {
    label: "Canister Smart Contract",
    icon: Shield,
    color: "oklch(0.65 0.15 280)",
  },
];

function TechSlide({ sRef }: { sRef: React.RefObject<HTMLElement | null> }) {
  return (
    <section
      ref={sRef as React.RefObject<HTMLElement>}
      id="tech"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-24"
      style={{ background: "oklch(0.13 0.02 250)" }}
    >
      <div className="w-full max-w-5xl mx-auto">
        <SlideHeading
          label="04 — Stack"
          title="Technology Stack"
          subtitle="Modern, performant, and decentralized"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[
            { title: "Frontend", items: frontendStack },
            { title: "Backend", items: backendStack },
          ].map((col) => (
            <div
              key={col.title}
              className="reveal rounded-2xl p-6"
              style={{
                background: "oklch(0.16 0.018 260)",
                border: "1px solid oklch(0.28 0.02 260)",
              }}
            >
              <h3
                className="text-sm font-bold mb-4 tracking-widest uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "oklch(0.75 0.15 190)",
                }}
              >
                {col.title}
              </h3>
              <div className="space-y-3">
                {col.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 hover:bg-white/5"
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        background: `${item.color}20`,
                        border: `1px solid ${item.color}40`,
                      }}
                    >
                      <item.icon
                        className="w-3.5 h-3.5"
                        style={{ color: item.color }}
                      />
                    </div>
                    <span
                      className="text-sm"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: "oklch(0.82 0.01 260)",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Infrastructure */}
        <div
          className="reveal rounded-xl p-4 text-center"
          style={{
            background: "oklch(0.75 0.15 190 / 0.1)",
            border: "1px solid oklch(0.75 0.15 190 / 0.3)",
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{
              fontFamily: "var(--font-display)",
              color: "oklch(0.8 0.01 260)",
            }}
          >
            <span style={{ color: "oklch(0.75 0.15 190)" }}>
              Infrastructure:
            </span>{" "}
            Deployed on Internet Computer (ICP) — Decentralized, Secure, Fast
          </p>
        </div>
      </div>
    </section>
  );
}

const flowSteps = [
  { label: "User Code", icon: Code2 },
  { label: "Backend Canister", icon: Server },
  { label: "Gemini AI API", icon: Brain },
  { label: "Structured Response", icon: Cpu },
  { label: "Categorized Feedback", icon: CheckCircle },
];

const aiPoints = [
  "Free tier — no cost for users",
  "Backend-managed API key — users never need a key",
  "Structured prompting for consistent JSON output",
  "500M cycles attached per HTTP outcall for compute fees",
];

function AISlide({ sRef }: { sRef: React.RefObject<HTMLElement | null> }) {
  return (
    <section
      ref={sRef as React.RefObject<HTMLElement>}
      id="ai"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-24"
      style={{ background: "oklch(0.11 0.015 260)" }}
    >
      <div className="w-full max-w-5xl mx-auto">
        <SlideHeading
          label="05 — AI Integration"
          title="Powered by Google Gemini"
          subtitle="Seamless AI pipeline from code input to structured feedback"
        />

        {/* Flow diagram */}
        <div className="reveal flex flex-wrap justify-center items-center gap-2 mb-10">
          {flowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: "oklch(0.75 0.15 190 / 0.15)",
                    border: "2px solid oklch(0.75 0.15 190 / 0.5)",
                  }}
                >
                  <step.icon
                    className="w-5 h-5"
                    style={{ color: "oklch(0.75 0.15 190)" }}
                  />
                </div>
                <span
                  className="text-xs mt-1.5 text-center max-w-16"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "oklch(0.6 0.01 260)",
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < flowSteps.length - 1 && (
                <div
                  className="w-6 h-0.5 shrink-0 mb-5"
                  style={{
                    background:
                      "linear-gradient(90deg, oklch(0.75 0.15 190 / 0.5), oklch(0.75 0.15 190))",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Points */}
        <div className="reveal grid grid-cols-1 sm:grid-cols-2 gap-4">
          {aiPoints.map((point) => (
            <div
              key={point}
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                background: "oklch(0.155 0.018 260)",
                border: "1px solid oklch(0.28 0.02 260)",
              }}
            >
              <CheckCircle
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: "oklch(0.75 0.15 190)" }}
              />
              <span
                className="text-sm"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "oklch(0.75 0.01 260)",
                }}
              >
                {point}
              </span>
            </div>
          ))}
        </div>

        {/* Gemini badge */}
        <div className="reveal mt-6 flex justify-center">
          <div
            className="inline-flex items-center gap-3 px-5 py-3 rounded-full"
            style={{
              background: "oklch(0.16 0.018 260)",
              border: "1px solid oklch(0.3 0.02 260)",
            }}
          >
            <Brain
              className="w-5 h-5"
              style={{ color: "oklch(0.6 0.18 145)" }}
            />
            <span
              className="text-sm font-semibold"
              style={{
                fontFamily: "var(--font-display)",
                color: "oklch(0.85 0.01 260)",
              }}
            >
              Google{" "}
              <span style={{ color: "oklch(0.6 0.18 145)" }}>Gemini</span> —
              Free Tier, Enterprise Quality
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

const pythonLines = [
  {
    lineNum: 1,
    text: "def calculate_total(items):",
    color: "oklch(0.75 0.15 190)",
  },
  { lineNum: 2, text: "  total = 0", color: "oklch(0.85 0.01 260)" },
  { lineNum: 3, text: "  for item in items:", color: "oklch(0.75 0.15 190)" },
  {
    lineNum: 4,
    text: "    total += item.price",
    color: "oklch(0.85 0.01 260)",
  },
  { lineNum: 5, text: "  return total", color: "oklch(0.7 0.15 85)" },
  { lineNum: 6, text: "", color: "" },
  {
    lineNum: 7,
    text: "# Missing: no input validation",
    color: "oklch(0.55 0.01 260)",
  },
  {
    lineNum: 8,
    text: "# Missing: no type hints",
    color: "oklch(0.55 0.01 260)",
  },
];

function DemoSlide({ sRef }: { sRef: React.RefObject<HTMLElement | null> }) {
  return (
    <section
      ref={sRef as React.RefObject<HTMLElement>}
      id="demo"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-24"
      style={{ background: "oklch(0.13 0.02 250)" }}
    >
      <div className="w-full max-w-5xl mx-auto">
        <SlideHeading
          label="06 — Live Demo"
          title="See It In Action"
          subtitle="Analyze any code snippet and get instant AI feedback"
        />

        <div className="reveal grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Code editor mock */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "oklch(0.13 0.018 260)",
              border: "1px solid oklch(0.25 0.02 260)",
            }}
          >
            <div
              className="flex items-center gap-1.5 px-4 py-3 border-b"
              style={{
                background: "oklch(0.155 0.018 260)",
                borderColor: "oklch(0.25 0.02 260)",
              }}
            >
              {[
                "oklch(0.65 0.2 25)",
                "oklch(0.7 0.15 85)",
                "oklch(0.65 0.18 145)",
              ].map((c) => (
                <div
                  key={c}
                  className="w-3 h-3 rounded-full"
                  style={{ background: c }}
                />
              ))}
              <span
                className="text-xs ml-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "oklch(0.5 0.01 260)",
                }}
              >
                calculate.py
              </span>
            </div>
            <div className="p-4">
              <pre
                className="text-sm leading-7"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {pythonLines.map((line) => (
                  <div key={`line-${line.lineNum}`}>
                    <span
                      style={{
                        color: "oklch(0.35 0.01 260)",
                        userSelect: "none",
                        marginRight: 12,
                      }}
                    >
                      {line.lineNum.toString().padStart(2, " ")}
                    </span>
                    <span style={{ color: line.color }}>{line.text}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>

          {/* Results mock */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: "oklch(0.155 0.018 260)",
              border: "1px solid oklch(0.28 0.02 260)",
            }}
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: "oklch(0.25 0.02 260)" }}
            >
              <span
                className="text-sm font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "oklch(0.9 0.01 260)",
                }}
              >
                Analysis Results
              </span>
              <span
                className="text-xs px-2 py-1 rounded-full font-mono"
                style={{
                  background: "oklch(0.65 0.18 145 / 0.15)",
                  color: "oklch(0.65 0.18 145)",
                }}
              >
                Done
              </span>
            </div>

            {/* Quality score */}
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "oklch(0.175 0.018 260)" }}
            >
              <span
                className="text-xs font-semibold"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "oklch(0.7 0.01 260)",
                }}
              >
                Quality Score
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "oklch(0.7 0.15 85 / 0.2)",
                    color: "oklch(0.7 0.15 85)",
                    border: "2px solid oklch(0.7 0.15 85 / 0.5)",
                  }}
                >
                  72
                </div>
              </div>
            </div>

            {/* Bug */}
            <div
              className="p-3 rounded-lg"
              style={{
                background: "oklch(0.65 0.2 25 / 0.08)",
                border: "1px solid oklch(0.65 0.2 25 / 0.3)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Bug
                  className="w-3.5 h-3.5"
                  style={{ color: "oklch(0.65 0.2 25)" }}
                />
                <span
                  className="text-xs font-bold"
                  style={{ color: "oklch(0.65 0.2 25)" }}
                >
                  1 Bug Found — High
                </span>
              </div>
              <p
                className="text-xs"
                style={{
                  color: "oklch(0.6 0.01 260)",
                  fontFamily: "var(--font-body)",
                }}
              >
                No input validation — items could be None or contain non-numeric
                prices.
              </p>
            </div>

            {/* Improvements */}
            <div
              className="p-3 rounded-lg"
              style={{
                background: "oklch(0.75 0.15 190 / 0.08)",
                border: "1px solid oklch(0.75 0.15 190 / 0.3)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp
                  className="w-3.5 h-3.5"
                  style={{ color: "oklch(0.75 0.15 190)" }}
                />
                <span
                  className="text-xs font-bold"
                  style={{ color: "oklch(0.75 0.15 190)" }}
                >
                  3 Improvements
                </span>
              </div>
              <p
                className="text-xs"
                style={{
                  color: "oklch(0.6 0.01 260)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Add type hints, use sum() builtin, add docstring.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p
            className="text-sm mb-4"
            style={{
              color: "oklch(0.55 0.01 260)",
              fontFamily: "var(--font-body)",
            }}
          >
            Analyze any code in seconds
          </p>
          <Link
            to="/"
            data-ocid="demo-cta"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
            style={{
              background: "oklch(0.75 0.15 190 / 0.15)",
              color: "oklch(0.75 0.15 190)",
              border: "1px solid oklch(0.75 0.15 190 / 0.4)",
              fontFamily: "var(--font-display)",
            }}
          >
            <Zap className="w-4 h-4" />
            Try It Yourself
          </Link>
        </div>
      </div>
    </section>
  );
}

const stats = [
  { value: "20+", label: "Languages Supported" },
  { value: "<2s", label: "Avg Analysis Time" },
  { value: "5", label: "Feedback Categories" },
  { value: "Free", label: "For All Users" },
];

const future = [
  {
    icon: Clock,
    title: "Review History & Export",
    desc: "Track improvements over time and export reports.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    desc: "Share code reviews with teammates and collaborate.",
  },
  {
    icon: Puzzle,
    title: "IDE Plugin",
    desc: "Integrate directly into VS Code for seamless workflow.",
  },
];

function ConclusionSlide({
  sRef,
}: { sRef: React.RefObject<HTMLElement | null> }) {
  return (
    <section
      ref={sRef as React.RefObject<HTMLElement>}
      id="conclusion"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-24"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.11 0.015 260) 0%, oklch(0.14 0.025 220) 100%)",
      }}
    >
      <div className="w-full max-w-5xl mx-auto">
        <SlideHeading label="07 — Impact" title="Impact & Future Scope" />

        {/* Stats */}
        <div className="reveal grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div
              key={s.label}
              className="text-center p-5 rounded-2xl"
              style={{
                background: "oklch(0.16 0.018 260)",
                border: "1px solid oklch(0.3 0.02 260)",
              }}
            >
              <div
                className="text-3xl font-bold mb-1"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "oklch(0.75 0.15 190)",
                }}
              >
                {s.value}
              </div>
              <div
                className="text-xs"
                style={{
                  color: "oklch(0.55 0.01 260)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Future scope */}
        <div className="reveal grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {future.map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-2xl"
              style={{
                background: "oklch(0.155 0.018 260)",
                border: "1px solid oklch(0.28 0.02 260)",
              }}
            >
              <f.icon
                className="w-5 h-5 mb-3"
                style={{ color: "oklch(0.75 0.15 190)" }}
              />
              <h3
                className="text-sm font-bold mb-1"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "oklch(0.9 0.01 260)",
                }}
              >
                {f.title}
              </h3>
              <p
                className="text-xs"
                style={{
                  color: "oklch(0.55 0.01 260)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Closing */}
        <div className="reveal text-center">
          <p
            className="text-2xl sm:text-3xl font-bold mb-6"
            style={{
              fontFamily: "var(--font-display)",
              background:
                "linear-gradient(135deg, oklch(0.9 0.01 260), oklch(0.75 0.15 190))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            "Democratizing code quality for every developer"
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              data-ocid="conclusion-cta"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.7 0.15 190), oklch(0.55 0.18 205))",
                color: "oklch(0.12 0.02 260)",
                fontFamily: "var(--font-display)",
              }}
            >
              <Zap className="w-4 h-4" />
              Try the Live App
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PresentationPage() {
  const refs = {
    title: useRef<HTMLElement>(null),
    problem: useRef<HTMLElement>(null),
    solution: useRef<HTMLElement>(null),
    features: useRef<HTMLElement>(null),
    tech: useRef<HTMLElement>(null),
    ai: useRef<HTMLElement>(null),
    demo: useRef<HTMLElement>(null),
    conclusion: useRef<HTMLElement>(null),
  };

  const slides: SlideRef[] = [
    { id: "title", label: "Title", ref: refs.title },
    { id: "problem", label: "Problem", ref: refs.problem },
    { id: "solution", label: "Solution", ref: refs.solution },
    { id: "features", label: "Features", ref: refs.features },
    { id: "tech", label: "Tech Stack", ref: refs.tech },
    { id: "ai", label: "AI Integration", ref: refs.ai },
    { id: "demo", label: "Demo", ref: refs.demo },
    { id: "conclusion", label: "Conclusion", ref: refs.conclusion },
  ];

  const activeIndex = useIntersectionObserver(slides.map((s) => s.ref));
  useScrollReveal();

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes float {
          0% { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-20px) scale(1.2); }
        }
        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <div
        style={{
          background: "oklch(0.11 0.015 260)",
          minHeight: "100vh",
          color: "oklch(0.95 0.01 260)",
        }}
      >
        <SlideDots slides={slides} activeIndex={activeIndex} />

        <TitleSlide sRef={refs.title} />
        <ProblemSlide sRef={refs.problem} />
        <SolutionSlide sRef={refs.solution} />
        <FeaturesSlide sRef={refs.features} />
        <TechSlide sRef={refs.tech} />
        <AISlide sRef={refs.ai} />
        <DemoSlide sRef={refs.demo} />
        <ConclusionSlide sRef={refs.conclusion} />

        {/* Floating back button */}
        <Link
          to="/"
          data-ocid="floating-back"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shadow-2xl transition-all duration-300 hover:scale-105"
          style={{
            background: "oklch(0.75 0.15 190 / 0.15)",
            color: "oklch(0.75 0.15 190)",
            border: "1px solid oklch(0.75 0.15 190 / 0.4)",
            backdropFilter: "blur(8px)",
            fontFamily: "var(--font-display)",
            boxShadow: "0 0 24px oklch(0.75 0.15 190 / 0.2)",
          }}
          aria-label="Back to App"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back to App</span>
        </Link>

        {/* Footer */}
        <footer
          className="py-6 px-4 text-center border-t"
          style={{
            background: "oklch(0.1 0.015 260)",
            borderColor: "oklch(0.22 0.02 260)",
          }}
        >
          <p
            className="text-xs"
            style={{
              color: "oklch(0.42 0.01 260)",
              fontFamily: "var(--font-body)",
            }}
          >
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "oklch(0.75 0.15 190)" }}
              className="hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
