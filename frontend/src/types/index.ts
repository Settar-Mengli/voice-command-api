export type Priority = "low" | "normal" | "high";

export interface Task {
  id: number;
  title: string;
  done: boolean;
  priority?: Priority;
}

export interface TaskCreate {
  title: string;
  done?: boolean;
  priority?: Priority;
}

export interface TaskUpdate {
  title?: string;
  done?: boolean;
  priority?: Priority;
}

export interface InstructionRequest {
  transcription: string;
}

export interface InstructionResponse {
  endpoint: string | null;
  method: string | null;
  params: Record<string, unknown>;
}

export type InstructionResult = InstructionResponse | InstructionResponse[];
