"use client";

import { useEffect, useRef } from "react";
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="dialog-sheet"
      aria-modal="true"
      aria-labelledby="bottomsheet-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-sheet__handle" aria-hidden="true" />
      <header className="dialog-sheet__header">
        <div className="flex min-w-0 items-center gap-3">
          {icon ? <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">{icon}</span> : null}
          <h2 id="bottomsheet-title" className="min-w-0 font-display text-xl text-navy-900 text-balance">{title}</h2>
        </div>
        <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-navy-800/60 hover:bg-navy-900/5" aria-label="Fechar janela">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </header>
      <div className="dialog-sheet__content">{children}</div>
      {actions ? <footer className="dialog-sheet__footer">{actions}</footer> : null}
    </dialog>,
    document.body,
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
