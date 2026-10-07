"use client"; // Garante que o componente rode exclusivamente no navegador

import { useEffect, useRef, useState } from "react";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Define o volume inicial mais baixo (30%) para manter uma música ambiente suave
    audio.volume = 0.3;

    const startAudio = () => {
      audio.play().catch(() => {
        console.log("Autoplay bloqueado pelo navegador. Aguardando interação do convidado.");
      });
    };

    // Tenta iniciar a música assim que o componente é montado na tela
    startAudio();

    // Fallback: Se o navegador bloquear o autoplay, toca no primeiro clique do usuário no site
    const handleFirstInteraction = () => {
      if (audio.paused) {
        startAudio();
      }
      document.removeEventListener("click", handleFirstInteraction);
    };

    document.addEventListener("click", handleFirstInteraction);

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
    };
  }, []);

  // Função para alternar o estado de Mute (Silenciar / Ativar som)
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  };

  return (
    <>
      {/* O arquivo 'background.mp3' deve ser colocado na pasta /public na raiz do projeto */}
      <audio ref={audioRef} src="/background.mp3" loop />
      
      {/* Botão flutuante discreto posicionado no canto inferior direito */}
      <button
        onClick={toggleMute}
        type="button"
        className="fixed bottom-24 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-md border border-amber-500/30 transition-all hover:scale-105 active:scale-95 md:bottom-6"
        aria-label={isMuted ? "Ativar som" : "Desativar som"}
      >
        {isMuted ? "🔇" : "🔊"}
      </button>
    </>
  );
}
