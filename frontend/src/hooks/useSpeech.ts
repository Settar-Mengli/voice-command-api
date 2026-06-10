import { useCallback, useEffect, useState } from "react";

export interface UseSpeechResult {
  isSupported: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  speak: (text: string) => void;
  cancel: () => void;
}

export function useSpeech(): UseSpeechResult {
  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [isMuted, setIsMuted] = useState(false);

  const cancel = useCallback((): void => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
  }, [isSupported]);

  const speak = useCallback(
    (text: string): void => {
      if (!isSupported || isMuted) {
        return;
      }
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      cancel();
      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, isMuted, cancel],
  );

  const toggleMute = useCallback((): void => {
    setIsMuted((prev) => {
      if (!prev) {
        cancel();
      }
      return !prev;
    });
  }, [cancel]);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return { isSupported, isMuted, toggleMute, speak, cancel };
}
