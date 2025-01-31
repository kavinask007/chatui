// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  provider: string;
}

export const models: Array<Model> = [
  {
    id: "groqq-gemma",
    label: "groq-gemma2-9b",
    apiIdentifier: "gemma2-9b-it",
    description: "For complex, multi-step tasks",
    provider: "groq",
  },
  {
    id: "groqq-llama770b",
    label: "groq-llama-3.1-70b-versatile",
    apiIdentifier: "llama-3.1-70b-versatile",
    description: "For complex, multi-step tasks",
    provider: "groq",
  },{
    id: "groqq-llama8b",
    label: "groq-llama-3.1-8b",
    apiIdentifier: "llama3-8b-8192",
    description: "For complex, multi-step tasks",
    provider: "groq",
  },
  {
    id: "bedrock-claude-3",
    label: "aws-bedrock-claude-3",
    apiIdentifier: "anthropic.claude-3-sonnet-20240229-v1:0",
    description: "For complex, multi-step tasks",
    provider: "aws",
  },
] as const;

export const DEFAULT_MODEL_NAME: string = "groq-gemma2-9b";
