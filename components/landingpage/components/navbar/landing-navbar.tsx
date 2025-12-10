"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useConvexAuth } from "convex/react";

import { WaitlistModal } from "@/components/landingpage/components/waitlist-modal";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const { scrollY } = useScroll();
  const { isAuthenticated } = useConvexAuth();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  });

  const navItems: { label: string; href: string }[] = [

  ];

  return (
    <motion.header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled 
          ? "bg-background/80 backdrop-blur-md border-b border-white/10 py-3" 
          : "bg-transparent py-6"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg transition-transform group-hover:scale-105">
            <div className="size-4 rounded-sm bg-white" />
          </div>
          <span className={cn(
            "font-bold text-xl tracking-tight transition-colors",
            scrolled ? "text-foreground" : "text-white"
          )}>
            FairLend
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-emerald-500",
                scrolled ? "text-muted-foreground" : "text-white/90 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {!isAuthenticated && (
            <a href="/sign-in">
              <Button 
                variant="ghost" 
                className={cn(
                  "font-semibold hover:bg-white/10",
                  scrolled ? "text-foreground hover:bg-emerald-50 dark:hover:bg-white/5" : "text-white hover:text-emerald-300"
                )}
              >
                Login
              </Button>
            </a>
          )}
          <Button 
            onClick={() => setShowWaitlistModal(true)}
            className={cn(
              "rounded-full font-bold shadow-lg transition-transform hover:scale-105",
              scrolled 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                : "bg-white text-emerald-900 hover:bg-emerald-50"
            )}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className={cn("size-6", scrolled ? "text-foreground" : "text-white")} />
          ) : (
            <Menu className={cn("size-6", scrolled ? "text-foreground" : "text-white")} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-6 md:hidden shadow-2xl"
        >
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-lg font-medium text-foreground/80 hover:text-emerald-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-border my-2" />
            <div className="flex flex-col gap-3">
              {!isAuthenticated && (
                <a href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg">Login</Button>
                </a>
              )}
              <Button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowWaitlistModal(true);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-lg py-6"
              >
                Get Started
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <WaitlistModal open={showWaitlistModal} onOpenChange={setShowWaitlistModal} />
    </motion.header>
  );
}
