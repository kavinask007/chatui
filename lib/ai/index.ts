import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { customMiddleware } from "./custom-middleware";
import { createGroq } from "@ai-sdk/groq";
import { createOllama } from "ollama-ai-provider";

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
  console.log(config)
  switch (provider?.provider?.name) {
    case "Groq":
      return createGroq(config);
    case "AWSBedrock":
      return createAmazonBedrock(config);
    case "Ollama":
      return createOllama(config);
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
      middleware: customMiddleware,
    });
  }

  return wrapLanguageModel({
    model: client(provider.modelId),
    middleware: customMiddleware,
  });
};
