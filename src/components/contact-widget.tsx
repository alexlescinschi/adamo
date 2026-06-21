"use client";

import { useState } from "react";
import { X, MessageCircle } from "lucide-react";

const PHONE = "37379966909";

const channels = [
  {
    label: "Telegram",
    href: `https://t.me/${PHONE}`,
    bg: "#29a8e8",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: `https://wa.me/${PHONE}`,
    bg: "#25d366",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    ),
  },
  {
    label: "Viber",
    href: `viber://chat?number=+${PHONE}`,
    bg: "#ffffff",
    icon: <img src="/viber.svg" alt="Viber" className="h-7 w-7" />,
  },
];

export function ContactWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      {/* Channels — slide up from button position */}
      <div
        className={`flex flex-col items-end gap-2 transition-all duration-300 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {channels.map((ch) => (
          <a
            key={ch.label}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2"
          >
            <span className="rounded-[8px] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#1d1d1f] shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
              {ch.label}
            </span>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 border border-[#e4e8e4]"
              style={{ background: ch.bg }}
            >
              {ch.icon}
            </div>
          </a>
        ))}
      </div>

      {/* FAB toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#7cc44e] to-[#63ad36] text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Contacte"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
