import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Layout } from "./components/Layout";
import { StatusBar } from "./components/StatusBar";
import { TaskList } from "./components/TaskList";
import { VoiceButton } from "./components/VoiceButton";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useTasks } from "./hooks/useTasks";
import { sendInstruction } from "./lib/api";

const UNSUPPORTED_MESSAGE =
  "Voice not supported in this browser. Try Chrome or Edge.";

export default function App(): ReactElement {
  const speech = useSpeechRecognition();
  const { tasks, isLoading, error: tasksError, executeInstruction } = useTasks();
  const [statusMessage, setStatusMessage] = useState("");
  const prevListeningRef = useRef(false);

  const handleVoiceButton = useCallback((): void => {
    if (!speech.isSupported) {
      return;
    }
    if (speech.isListening) {
      speech.stop();
    } else {
      setStatusMessage("");
      speech.start();
    }
  }, [speech]);

  useEffect(() => {
    const wasListening = prevListeningRef.current;
    prevListeningRef.current = speech.isListening;
    if (!wasListening || speech.isListening) {
      return;
    }

    const text = speech.transcription.trim();
    if (!text) {
      return;
    }

    void (async () => {
      setStatusMessage("Thinking...");
      try {
        const response = await sendInstruction(text);
        const summary = await executeInstruction(response);
        setStatusMessage(summary);
      } catch (e) {
        setStatusMessage(
          `Something went wrong: ${e instanceof Error ? e.message : String(e)}`,
        );
      } finally {
        speech.reset();
      }
    })();
  }, [speech, executeInstruction]);

  const displayedMessage = speech.isSupported
    ? statusMessage
    : UNSUPPORTED_MESSAGE;

  const displayedError = tasksError ?? speech.error;

  return (
    <Layout>
      <section
        aria-label="Voice control"
        className="flex flex-col items-center gap-6"
      >
        <VoiceButton
          isListening={speech.isListening}
          disabled={!speech.isSupported}
          onClick={handleVoiceButton}
        />
        <StatusBar
          message={displayedMessage}
          transcription={speech.transcription}
          error={displayedError}
          isListening={speech.isListening}
        />
      </section>
      <TaskList tasks={tasks} isLoading={isLoading} />
    </Layout>
  );
}
