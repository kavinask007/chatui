// import { openai } from "@ai-sdk/openai";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

import { customMiddleware } from "./custom-middleware";
import { createGroq } from "@ai-sdk/groq";
const groq = createGroq({
  // custom settings
  apiKey: process.env.GROQ_API_KEY,
});
export const customModel = (apiIdentifier: string, provider: string) => {
  let model;
  if (provider == "groq") {
    model = groq(apiIdentifier);
  } else if (provider == "aws") {
    model = bedrock(apiIdentifier);
  }
  if (model) {
    return wrapLanguageModel({
      model: model,
      middleware: customMiddleware,
    });
  }
  return wrapLanguageModel({
    model: groq(apiIdentifier),
    middleware: customMiddleware,
  });
};
