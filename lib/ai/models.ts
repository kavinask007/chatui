// import { getUserAvailableModels } from "@/lib/db/queries";

export interface Model {
  id: string;
  name: string;
  modelId: string;
  description: string | null;
  providerId: string;
}

// Function to get models from DB for the current user
// export async function getModels(userId: string): Promise<Array<Model>> {
//   try {
//     const models = await getUserAvailableModels(userId);
//     return models;
//   } catch (error) {
//     console.error("Failed to get models from database:", error);
//     return [];
//   }
// }
export const models: Array<Model> = [
  {
    id: "groqq-gemma",
    name: "groq-gemma2-9b",
    modelId: "gemma2-9b-it",
    description: "For complex, multi-step tasks",
    providerId: "groq",
  },
];

// Default model will need to be determined dynamically based on available models
export const DEFAULT_MODEL_NAME = ""; // Set this based on first available model
