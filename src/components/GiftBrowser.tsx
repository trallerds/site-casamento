"use client";

import { useMemo, useState } from "react";
import { GiftCard } from "@/components/GiftCard";
import type { GiftRow } from "@/lib/queries";

type Group = [string, GiftRow[]];

export function GiftBrowser({ groups }: { groups: Group[] }) {
  const categories = useMemo(() => groups.map(([name]) => name), [groups]);
  const [active, setActive] = useState<string | null>(null);
  const visible = active ? groups.filter(([name]) => name === active) : groups;

  return (
    <div>
      <div className="-mx-6 overflow-x-auto px-6 pb-1 md:mx-0 md:px-0">
        <div role="group" aria-label="Filtrar por categoria" className="flex w-max gap-2">
          <CategoryChip active={active === null} onClick={() => setActive(null)}>
            Todos
          </CategoryChip>
          {categories.map((name) => (
            <CategoryChip key={name} active={active === name} onClick={() => setActive(name)}>
              {name}
            </CategoryChip>
          ))}
        </div>
      </div>

      {visible.map(([name, gifts]) => (
        <section key={name} className="mt-10">
          <h2 className="font-display text-xl text-navy-900">{name}</h2>
          <div className="rule-gold mt-3 w-16" />
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gifts.map((gift) => (
              <GiftCard key={gift.id} gift={gift} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs uppercase tracking-[0.16em] transition ${
        active
          ? "border-navy-900 bg-navy-900 text-ivory"
          : "border-navy-900/20 text-navy-800/70 hover:border-gold-500 hover:text-gold-700"
      }`}
    >
      {children}
    </button>
  );
}