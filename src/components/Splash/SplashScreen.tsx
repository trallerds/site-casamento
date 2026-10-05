"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  weddingDate: string;
  names: string;
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <span className="text-5xl md:text-7xl font-display text-ivory tabular-nums">
        {value}
      </span>
      <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-gold-400/70 mt-2 font-body">
        {label}
      </span>
    </div>
  );
}

export function SplashScreen({ weddingDate: targetDate, names }: SplashScreenProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        clearInterval(timer);
        setIsExiting(true);
        setTimeout(() => setIsVisible(false), 1000);
        return;
      }

      setTimeLeft({
        days: String(Math.floor(difference / (1000 * 60 * 60 * 24))).padStart(2, "0"),
        hours: String(Math.floor((difference / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
        minutes: String(Math.floor((difference / 1000 / 60) % 60)).padStart(2, "0"),
        seconds: String(Math.floor((difference / 1000) % 60)).padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-navy-950 text-ivory transition-all duration-1000 ease-in-out ${
        isExiting ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background Art - Cinematic Depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-gold-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-navy-800/30 blur-[120px] rounded-full" />
        
        {/* Botanical-inspired radial lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="var(--color-gold-500)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="50%" cy="50%" r="40%" stroke="url(#grad1)" strokeWidth="1" fill="none" />
          <circle cx="50%" cy="50%" r="30%" stroke="url(#grad1)" strokeWidth="0.5" fill="none" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">
        {/* Logo with subtle glow */}
        <div className="relative mb-10 group">
          <div className="absolute inset-0 blur-2xl bg-gold-500/20 rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
          <Image
            src="/logo.jpg"
            alt="Logo Casamento J&J"
            width={160}
            height={160}
            className="relative h-32 w-auto object-contain drop-shadow-2xl animate-in fade-in zoom-in duration-1000"
            priority
          />
        </div>
        
        <h1 className="font-display text-3xl md:text-5xl text-gold-500 uppercase tracking-[0.3em] mb-16 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
          {names}
        </h1>

        <div className="flex items-center justify-center gap-6 md:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <TimeUnit value={timeLeft.days} label="Dias" />
          
          <div className="flex items-center gap-4 md:gap-6 px-4 py-2 rounded-full border border-gold-600/30 bg-gold-600/5 backdrop-blur-sm">
            <TimeUnit value={timeLeft.hours} label="Hrs" />
            <span className="text-2xl md:text-4xl font-display text-gold-600/60 mb-5">:</span>
            <TimeUnit value={timeLeft.minutes} label="Min" />
            <span className="text-2xl md:text-4xl font-display text-gold-600/60 mb-5">:</span>
            <TimeUnit value={timeLeft.seconds} label="Seg" />
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-700">
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50" />
          <p className="font-display text-lg md:text-xl italic text-gold-200/80 tracking-wide">
            até o nosso dia
          </p>
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50" />
        </div>
      </div>
    </div>
  );
}
