"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, icon, children, actions }: BottomSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/60 backdrop-blur-sm p-4 md:p-0" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-2xl transform transition-all duration-300 sm:mx-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottomsheet-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-navy-900/10">
          <div className="flex items-center gap-3">
            {icon && <div className="p-2 rounded-full bg-gold-100 text-gold-700">{icon}</div>}
            <h2 id="bottomsheet-title" className="font-display text-xl text-navy-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-navy-800/50 hover:bg-navy-900/10 transition-colors"
            aria-label="Fechar"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
        {actions && <div className="px-4 pb-4">{actions}</div>}
      </div>
    </div>,
    document.body
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: () => void;
  actionLabel?: string;
}

export function InfoItem({ icon, label, value, action, actionLabel }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-card border border-navy-900/10 bg-white">
      <div className="flex-shrink-0 p-2 rounded-full bg-gold-100 text-gold-700">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gold-700">{label}</p>
        <p className="mt-1 font-display text-lg text-navy-900 text-balance">{value}</p>
      </div>
      {action && actionLabel && (
        <button
          onClick={action}
          className="flex-shrink-0 ml-4 px-4 py-2 text-sm uppercase tracking-[0.15em] text-gold-700 border border-gold-500/50 rounded-full transition hover:bg-gold-50"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function SectionDivider() {
  return <div className="my-6 border-t border-navy-900/10" />;
}
