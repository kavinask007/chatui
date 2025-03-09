import { experimental_wrapLanguageModel as wrapLanguageModel ,extractReasoningMiddleware} from "ai";
import { customMiddleware } from "./custom-middleware";
import {
  createAmazonBedrock,
  AmazonBedrockProviderSettings,
} from "@ai-sdk/amazon-bedrock";
import { createGroq, GroqProviderSettings } from "@ai-sdk/groq";
import { createOllama, OllamaProviderSettings } from "ollama-ai-provider";
import { createMistral, MistralProviderSettings } from "@ai-sdk/mistral";

// Map of settings for each provider
export const providerSettings = {
  bedrock: {
    region: true,
    accessKeyId: true,
    secretAccessKey: true,
    sessionToken: true,
    baseURL: true,
  },
  groq: {
    baseURL: true,
    apiKey: true,
  },
  mistral: {
    baseURL: true,
    apiKey: true,
  },
  ollama: {
    baseURL: true,
  },
} as const;

const createClient = (provider: any) => {
  // Get credentials if they exist
  const credentials = provider?.credentials;
  const config: any = {};
  // Add credential value to config if it exists
  if (credentials?.value) {
    config[credentials.key] = credentials.value;
  }

  // Add any additional configuration
  if (provider?.provider?.configuration) {
    Object.entries(provider.provider.configuration).forEach(([key, value]) => {
      if (value && value !== "") {
        config[key] = value;
      }
    });
  }
  switch (provider?.provider?.name) {
    case "groq":
      return createGroq(config);
    case "bedrock":
      return createAmazonBedrock(config);
    case "ollama":
      config["simulateStreaming"] = true;
      return createOllama(config);
    case "mistral":
      return createMistral(config);
    default:
      return null;
  }
  return null;
};

export const customModel = (provider: any) => {
  const client = createClient(provider);
  if (!client) {
    // Fallback to groq if provider not supported
    return wrapLanguageModel({
      model: createGroq({ apiKey: process.env.GROQ_API_KEY })("gemma2-9b-it"),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  }

  return wrapLanguageModel({
    model: client(provider.modelId),
    middleware: extractReasoningMiddleware({ tagName: 'think' }),
  });
};
