export interface Task {
  id: number;
  title: string;
  done: boolean;
}

export interface TaskCreate {
  title: string;
  done?: boolean;
}

export interface TaskUpdate {
  title?: string;
  done?: boolean;
}

export interface InstructionRequest {
  transcription: string;
}

export interface InstructionResponse {
  endpoint: string | null;
  method: string | null;
  params: Record<string, unknown>;
}
