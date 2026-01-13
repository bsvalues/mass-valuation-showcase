import { useCallback } from "react";

export function useSystemVoice() {
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a "tech" sounding voice
    const voices = window.speechSynthesis.getVoices();
    const techVoice = voices.find(v => 
      v.name.includes("Google US English") || 
      v.name.includes("Samantha") || 
      v.name.includes("Microsoft Zira")
    );

    if (techVoice) {
      utterance.voice = techVoice;
    }

    utterance.pitch = 1.0;
    utterance.rate = 1.1;
    utterance.volume = 0.8;

    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak };
}
