// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: "groqq-gemma",
    label: "groq-gemma2-9b",
    apiIdentifier: "gemma2-9b-it",
    description: "For complex, multi-step tasks asdfasdf af a",
  },
  {
    id: "groqq-llama770b",
    label: "groq-llama-3.1-70b-versatile",
    apiIdentifier: "llama-3.1-70b-versatile",
    description: "For complex, multi-step tasks asdfasdf af a",
  },
] as const;

export const DEFAULT_MODEL_NAME: string = "gpt-4o-mini";
