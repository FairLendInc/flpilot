"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useConvexAuth } from "convex/react";
import {
	Sheet,
	SheetContent,
	SheetTrigger,
} from "@/components/ui/sheet";

import { useWaitlist } from "@/lib/context/waitlist-context";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  // const [showWaitlistModal, setShowWaitlistModal] = useState(false); // Removed local state
  const { setShowWaitlistModal } = useWaitlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="md:hidden p-2"
              aria-label="Toggle navigation"
            >
              <Menu className={cn("size-6", scrolled ? "text-foreground" : "text-white")} />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-background/60 backdrop-blur-2xl border-border/50 shadow-2xl sm:max-w-sm w-full px-6 py-6"
          >
            <div className="flex flex-col gap-6 h-full">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="text-lg font-bold tracking-tight"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  FairLend
                </Link>
              </div>

              <div className="flex flex-col gap-2">
                {navItems.map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx, duration: 0.25 }}
                  >
                    <Link
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-lg font-medium text-foreground/90 transition-colors hover:bg-emerald-500/10 hover:text-emerald-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto space-y-3 pt-2">
                {!isAuthenticated && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-lg hover:bg-white/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowWaitlistModal(true);
                  }}
                  className="w-full rounded-full bg-emerald-600 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:-translate-y-px hover:bg-emerald-700 hover:shadow-xl"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  );
}
