"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  weddingDate: string;
  names: string;
}

export function SplashScreen({ weddingDate: targetDate, names }: SplashScreenProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsVisible(false);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-navy-900 text-ivory transition-opacity duration-700 ease-in-out">
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <Image
          src="/logo.jpg"
          alt="Logo Casamento J&J"
          width={200}
          height={200}
          className="mb-8 h-32 w-auto object-contain"
          priority
        />
        
        <h1 className="font-display text-2xl md:text-4xl text-gold-500 uppercase tracking-widest mb-12">
          {names}
        </h1>

        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-5xl md:text-7xl font-display text-ivory">
              {String(timeLeft.days).padStart(2, "0")}
            </span>
            <span className="text-xs md:text-sm uppercase tracking-widest text-gold-400 mt-2">
              Dias
            </span>
          </div>

          <div className="flex items-center gap-4 text-4xl md:text-6xl font-display text-ivory">
            <div className="flex flex-col items-center">
              {String(timeLeft.hours).padStart(2, "0")}
              <span className="text-xs md:text-sm uppercase tracking-widest text-gold-400 block text-center mt-2">
                Hrs
              </span>
            </div>
            <span className="text-gold-600">:</span>
            <div className="flex flex-col items-center">
              {String(timeLeft.minutes).padStart(2, "0")}
              <span className="text-xs md:text-sm uppercase tracking-widest text-gold-400 block text-center mt-2">
                Min
              </span>
            </div>
            <span className="text-gold-600">:</span>
            <div className="flex flex-col items-center">
              {String(timeLeft.seconds).padStart(2, "0")}
              <span className="text-xs md:text-sm uppercase tracking-widest text-gold-400 block text-center mt-2">
                Seg
              </span>
            </div>
          </div>
        </div>

        <p className="mt-12 font-display text-lg md:text-xl italic text-gold-200 opacity-80">
          até o nosso dia
        </p>
      </div>
      
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gold-600/20 blur-3xl rounded-full" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-navy-800/40 blur-3xl rounded-full" />
      </div>
    </div>
  );
}
