<p align="center">
  An Open-Source AI Chatbot extenstion from the Template Built With Next.js and the AI SDK by Vercel.
</p>

<video src="https://kavinask007.github.io/chatui/demo.mp4" controls></video>


<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports OpenAI (default), Anthropic, Cohere, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence

  - Postgres for saving chat history and user data
  - minio for efficient file storage

- Simple and secure authentication with Google Oauth and Auth0 can easily extend to other providers using [NextAuth.js](https://github.com/nextauthjs/next-auth)

## Model Providers

- OpenAI
- Ollama
- Groq
- Bedrock

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Chatbot.

```bash
pnpm install
npx drizzle-kit generate
npx drizzle-kit migrate
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

By default all login is restricted , user email needs to be added to VerifiedUsers table . This can be done by manually adding it to db or through this script.

```bash
pnpm users:add --admin username@email.com
```

Only admin users are allowed to edit the model,provider,mcp tools config in settings page as of now.

Run this command again once the user signed up to make them admin 
```bash
pnpm users:add --admin username@email.com
```
