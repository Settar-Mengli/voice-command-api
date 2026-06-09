import { useCallback, useEffect, useRef, useState } from "react";

interface ISpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

interface SpeechRecognitionWindow {
  SpeechRecognition?: ISpeechRecognitionConstructor;
  webkitSpeechRecognition?: ISpeechRecognitionConstructor;
}

function getRecognitionConstructor(): ISpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const w = window as unknown as SpeechRecognitionWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionResult {
  isListening: boolean;
  transcription: string;
  error: string | null;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isSupported = getRecognitionConstructor() !== null;

  useEffect(() => {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) {
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscription(text.trim());
    };

    recognition.onerror = (event) => {
      setError(event.message || event.error || "Speech recognition error");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }
    setError(null);
    setTranscription("");
    try {
      recognition.start();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start recognition");
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setTranscription("");
    setError(null);
  }, []);

  return {
    isListening,
    transcription,
    error,
    isSupported,
    start,
    stop,
    reset,
  };
}
