"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "@/hooks/use-translations";

const PHONE = "37379966909";

const channels = [
  {
    label: "Viber",
    href: `viber://chat?number=%2B${PHONE}`,
    className: "viber",
    bg: "#7360f2",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path d="M20 11.5a8 8 0 0 1-8.4 8l-3.6 2v-3A8.1 8.1 0 1 1 20 11.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.4 8.1c.6 4 2.2 5.7 6.1 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m8.7 8.3 1.2 1.5-.8 1M14.5 14.5l-1.3-.8 1-1.2 1.5 1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.6 7.1a4.2 4.2 0 0 1 2.3 2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: `https://wa.me/${PHONE}`,
    className: "whatsapp",
    bg: "#24a861",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path d="M20.2 11.6a8.2 8.2 0 0 1-11.8 7.3L4 20.3l1.4-4.2A8.2 8.2 0 1 1 20.2 11.6Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.8 8.4c.4 3.4 2.4 5.4 5.8 6.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m9.3 8.4 1.3 1.7-.9 1.1M14.6 14.5l-1.1-1 1.2-1.2 1.8 1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    href: `tg://resolve?phone=${PHONE}`,
    className: "telegram",
    bg: "#229ed9",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path d="m21 4-4.1 16-6.1-4.3-3.1 2.9.6-5.5L19.2 5.5 6.1 11.4 2.8 10 21 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m8.3 13.1 8.6-6.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: null,
    href: `tel:+${PHONE}`,
    className: "phone",
    bg: "#5c6b7a",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path d="M7.2 3.4 9.3 8a2 2 0 0 1-.5 2.3l-1 1a14.6 14.6 0 0 0 5 5l1-1a2 2 0 0 1 2.3-.5l4.5 2.1v3.2a2 2 0 0 1-2.2 2A18.6 18.6 0 0 1 2.9 6.6a2 2 0 0 1 2-2.2h2.3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function ContactWidget() {
  const tr = useTranslations();
  const [open, setOpen] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const promptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show prompt bubble after 3s, auto-hide after 8s
  useEffect(() => {
    if (interacted) return;
    const show = setTimeout(() => setPromptVisible(true), 3000);
    return () => clearTimeout(show);
  }, [interacted]);

  useEffect(() => {
    if (!promptVisible || interacted) return;
    promptTimer.current = setTimeout(() => setPromptVisible(false), 8000);
    return () => { if (promptTimer.current) clearTimeout(promptTimer.current); };
  }, [promptVisible, interacted]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleFabClick = () => {
    setInteracted(true);
    setPromptVisible(false);
    setOpen((v) => !v);
  };

  const handlePromptClick = () => {
    setInteracted(true);
    setPromptVisible(false);
    setOpen(true);
  };

  const handleChannelClick = () => {
    setInteracted(true);
    setOpen(false);
  };

  return (
    <aside
      ref={ref}
      className={`fixed z-60 grid justify-items-end font-sans ${promptVisible && !open ? "is-prompt-visible" : ""} ${open ? "is-open" : ""}`}
      style={{ right: "max(22px, env(safe-area-inset-right))", bottom: "max(22px, env(safe-area-inset-bottom))" }}
      aria-label={tr.a11y.contactWidget}
    >
      {/* Prompt bubble */}
      <button
        type="button"
        onClick={handlePromptClick}
        className={`absolute w-max max-w-[min(250px,calc(100vw-116px))] min-h-[42px] py-[9px] px-[14px] border border-white/[.82] rounded-[8px] text-[13px] font-semibold leading-[1.25] text-[#111827] cursor-pointer transition-all duration-[.24s] backdrop-blur-[20px] ${
          promptVisible && !open
            ? "opacity-100 visible pointer-events-auto translate-x-0 scale-100"
            : "opacity-0 invisible pointer-events-none translate-x-[6px] scale-[.985]"
        }`}
        style={{
          right: "69px",
          bottom: "6px",
          background: "rgba(249, 251, 253, .76)",
          boxShadow: "0 12px 32px rgba(24, 35, 52, .13), inset 0 1px 0 rgba(255, 255, 255, .92)",
          WebkitBackdropFilter: "blur(20px) saturate(135%)",
          backdropFilter: "blur(20px) saturate(135%)",
        }}
        aria-expanded={open}
      >
        {tr.chat.online}
        <span
          className="absolute w-[10px] h-[10px] border-t border-r border-white/[.82] rotate-45"
          style={{ right: "-6px", bottom: "13px", background: "rgba(249, 251, 253, .76)" }}
        />
      </button>

      {/* Channel menu */}
      <nav
        className={`absolute grid gap-[2px] w-[232px] p-2 border border-white/[.82] rounded-[8px] transition-all duration-[.22s] origin-bottom-right ${
          open
            ? "opacity-100 visible pointer-events-auto translate-y-0 scale-100"
            : "opacity-0 invisible pointer-events-none translate-y-[8px] scale-[.985]"
        }`}
        style={{
          right: "0",
          bottom: "68px",
          background: "rgba(245, 248, 251, .78)",
          boxShadow: "0 20px 48px rgba(24, 35, 52, .17), inset 0 1px 0 rgba(255, 255, 255, .94)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          backdropFilter: "blur(24px) saturate(140%)",
        }}
        aria-label={tr.a11y.chooseContact}
        aria-hidden={!open}
      >
        {channels.map((ch) => (
          <a
            key={ch.className}
            href={ch.href}
            target={ch.className !== "phone" ? "_blank" : undefined}
            rel={ch.className !== "phone" ? "noopener noreferrer" : undefined}
            onClick={handleChannelClick}
            className="grid grid-cols-[minmax(0,1fr)_36px] items-center gap-3 min-h-[48px] py-[6px] pl-3 pr-[6px] rounded-[6px] text-[13.5px] font-bold leading-[1.2] text-[#202938] transition-[background,box-shadow] duration-[.18s] hover:bg-white/70 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,.68)] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_rgba(84,160,47,.42)]"
          >
            <span className="min-w-0 text-left">{ch.label || tr.contact.phone}</span>
            <span
              className="grid place-items-center w-9 h-9 flex-shrink-0 rounded-[7px] text-white"
              style={{
                background: ch.bg,
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, .18), 0 3px 9px rgba(28, 39, 55, .1)",
              }}
            >
              {ch.icon}
            </span>
          </a>
        ))}
      </nav>

      {/* FAB button */}
      <button
        type="button"
        onClick={handleFabClick}
        className="relative grid place-items-center w-14 h-14 p-0 border border-white/[.34] rounded-full text-white cursor-pointer transition-[transform,box-shadow] duration-[.18s] hover:-translate-y-[1px] hover:shadow-[0_15px_34px_rgba(69,139,40,.36),inset_0_1px_0_rgba(255,255,255,.28)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(84,160,47,.24)] focus-visible:outline-offset-[3px]"
        style={{
          background: "linear-gradient(180deg, #73b944, #55a02d)",
          boxShadow: "0 12px 30px rgba(69, 139, 40, .3), inset 0 1px 0 rgba(255, 255, 255, .24)",
        }}
        aria-label={open ? tr.a11y.closeContacts : tr.a11y.openContacts}
        aria-expanded={open}
      >
        {/* Typing dots */}
        <span className={`absolute left-[10px] bottom-[10px] flex items-center justify-center gap-[2.5px] w-[18px] h-[5px] pointer-events-none transition-opacity duration-[.18s] ${open ? "opacity-0" : ""}`}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[3px] h-[3px] rounded-full bg-white/[.94] opacity-[.34]"
              style={{
                boxShadow: "0 1px 2px rgba(40, 83, 22, .18)",
                animation: `contact-typing-dot 4.2s ease-in-out infinite`,
                animationDelay: `${i * 0.14}s`,
              }}
            />
          ))}
        </span>

        {/* Phone icon */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`absolute w-6 h-6 transition-all duration-[.22s] ${
            open ? "opacity-0 rotate-[35deg] scale-75" : "opacity-100 -translate-y-[3px]"
          }`}
          style={{ strokeWidth: 1.85 }}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7.2 3.4 9.3 8a2 2 0 0 1-.5 2.3l-1 1a14.6 14.6 0 0 0 5 5l1-1a2 2 0 0 1 2.3-.5l4.5 2.1v3.2a2 2 0 0 1-2.2 2A18.6 18.6 0 0 1 2.9 6.6a2 2 0 0 1 2-2.2h2.3Z" />
        </svg>

        {/* Close icon */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`absolute w-6 h-6 transition-all duration-[.22s] ${
            open ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-45 scale-75"
          }`}
          style={{ strokeWidth: 1.85 }}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}
