'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

const HERO_CODE = `# Chapter 4: Shuffles — The Performance Killer
# From Gridlock's PySpark Theory Guide

# ❌ Two shuffles — slow
result = (
    events_1B
    .join(users, "user_id")         # shuffle #1
    .groupBy("country").count()      # shuffle #2
)

# ✅ Pre-aggregate first — one shuffle
user_counts = (
    events_1B
    .groupBy("user_id").count()
)
result = (
    user_counts
    .join(broadcast(users), "user_id")
    .groupBy("country").sum("count")
)`;

export const HeroSection = () => {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#6b7fff 1px, transparent 1px), linear-gradient(90deg, #6b7fff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div
        className="pointer-events-none absolute left-1/4 top-1/3 h-[600px] w-[600px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #6b7fff, transparent 70%)' }}
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 py-24 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#6b7fff]/20 bg-[#6b7fff]/10 px-3 py-1.5 text-xs font-medium text-[#6b7fff]">
            <Zap className="h-3 w-3" />
            Data Engineering · Theory + Reference + Practice
          </div>

          <h1 className="mb-6 font-serif text-5xl font-bold leading-[1.1] tracking-tight lg:text-6xl">
            Master data
            <br />
            engineering
            <br />
            <span className="text-[#6b7fff]">that actually scales.</span>
          </h1>

          <p className="mb-8 max-w-md text-lg leading-relaxed text-[#a3a3a3]">
            Theory, function reference, and practice questions for PySpark, SQL,
            Python, and Microsoft Fabric.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group flex items-center justify-center gap-2 rounded-xl bg-[#6b7fff] px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-[#5a6ef0]"
            >
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#topics"
              className="flex items-center justify-center gap-2 rounded-xl border border-[#1f1f1f] px-6 py-3 font-medium text-[#a3a3a3] transition-all duration-200 hover:border-[#333] hover:text-white"
            >
              See what&apos;s inside
            </a>
          </div>

          <p className="mt-6 text-xs text-[#525252]">
            Free forever · No credit card · Pro from $12/mo
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:block"
        >
          <div className="overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#111111] shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 border-b border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-xs text-[#525252]">
                PySpark · Chapter 4 · Shuffle Optimization
              </span>
            </div>

            <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-[#d4d4d4]">
              <code>{HERO_CODE}</code>
            </pre>

            <div className="flex items-center gap-3 border-t border-[#1f1f1f] px-4 py-3">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#1f1f1f]">
                <div className="h-full w-3/4 rounded-full bg-[#6b7fff]" />
              </div>
              <span className="font-mono text-xs text-[#525252]">3/4 sections read</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
