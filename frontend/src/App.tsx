import type { ReactElement } from "react";
import { Layout } from "./components/Layout";
import { StatusBar } from "./components/StatusBar";
import { TaskList } from "./components/TaskList";
import { VoiceButton } from "./components/VoiceButton";
import type { Task } from "./types";

const PLACEHOLDER_TASKS: Task[] = [
  { id: 1, title: "Buy groceries", done: false },
  { id: 2, title: "Call mom", done: true },
  { id: 3, title: "Finish portfolio README", done: false },
];

export default function App(): ReactElement {
  return (
    <Layout>
      <section
        aria-label="Voice control"
        className="flex flex-col items-center gap-6"
      >
        <VoiceButton isListening={false} />
        <StatusBar transcription="" error={null} />
      </section>
      <TaskList tasks={PLACEHOLDER_TASKS} />
    </Layout>
  );
}
