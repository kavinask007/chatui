// import { getUserAvailableModels } from "@/lib/db/queries";

export interface Model {
  id: string;
  name: string;
  modelId: string;
  description: string | null;
  providerId: string;
}


// Default model will need to be determined dynamically based on available models
export const DEFAULT_MODEL_NAME = ""; // Set this based on first available model
