import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { jsonSchema, type CoreTool } from "ai";

type ToolSetConfig = {
  mcpServers: {
    [key: string]: {
      command: string;
      args: string[];
      env?: Record<string, string>;
    };
  };
  // onCallTool is a function that will be called when a tool is called. It will be passed the server name, tool name, arguments, and a function that will resolve to the result of the tool call. Useful for timing the tool calls or doing other instrumentation like logging.
  onCallTool?: (
    serverName: string,
    toolName: string,
    args: any,
    result: Promise<string>
  ) => void;
};

type ToolSet = {
  tools: {
    [key: string]: CoreTool;
  };
  clients: {
    [key: string]: Client;
  };
};

export async function createToolSet(config: ToolSetConfig): Promise<ToolSet> {
  let toolset: ToolSet = {
    tools: {},
    clients: {},
  };

  // could probably speed this up by spinning these up in parallel
  for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
    const transport = new StdioClientTransport({
      ...serverConfig,
      stderr: process.stderr,
    });

    const client = new Client(
      {
        name: `${serverName}-client`,
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );
    toolset.clients[serverName] = client;
    await client.connect(transport);

    // Get list of tools and add them to the toolset
    const toolList = await client.listTools();
    for (const tool of toolList.tools) {
      let toolName = tool.name;
      if (toolName !== serverName) {
        toolName = `${serverName}_${toolName}`;
      }
      toolset.tools[toolName] = {
        description: tool.description || "",
        parameters: jsonSchema(tool.inputSchema),
        execute: async (args) => {
          const resultPromise = (async () => {
            try {
              const result = await client.callTool({
                name: tool.name,
                arguments: args,
              });
              return JSON.stringify(result);
            } catch (error) {
              console.error(`Error calling tool ${toolName}:`, error);
              throw error;
            }
          })();
          if (config.onCallTool) {
            config.onCallTool(serverName, toolName, args, resultPromise);
          }
          return resultPromise;
        },
      };
    }
  }

  return toolset;
}