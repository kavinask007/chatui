// import { openai } from "@ai-sdk/openai";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";
// import { groq } from '@ai-sdk/groq';
import { customMiddleware } from "./custom-middleware";
import { createGroq } from "@ai-sdk/groq";
const groq = createGroq({
  // custom settings
  apiKey: process.env.GROQ_API_KEY,
});
export const customModel = (apiIdentifier: string) => {
  return wrapLanguageModel({
    model: groq(apiIdentifier),
    middleware: customMiddleware,
  });
};
