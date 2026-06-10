"use client";

import { useState } from "react";
import { Phone, MessageCircle, MessageSquare, ChevronUp } from "lucide-react";

const PHONE = "+37379966909";

const channels = [
  { label: "Telefon", href: `tel:${PHONE}`, icon: Phone, bg: "bg-[#1d1d1f]" },
  { label: "Viber", href: `viber://chat?number=${PHONE}`, icon: MessageCircle, bg: "bg-[#7360f2]" },
  { label: "WhatsApp", href: `https://wa.me/${PHONE}`, icon: MessageSquare, bg: "bg-[#25d366]" },
  { label: "Messenger", href: `https://m.me/`, icon: MessageCircle, bg: "bg-[#0084ff]" },
];

export function ContactWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col gap-3">
          {channels.map((ch) => (
            <a
              key={ch.label}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3"
            >
              <span className="rounded-[28px] bg-white px-4 py-2 text-sm font-medium text-[#1d1d1f] shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                {ch.label}
              </span>
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${ch.bg} text-white shadow-lg transition-transform hover:scale-105`}>
                <ch.icon className="h-5 w-5" />
              </div>
            </a>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#7cc44e] to-[#63ad36] text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? <ChevronUp className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
