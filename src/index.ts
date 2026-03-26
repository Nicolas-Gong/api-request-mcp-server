#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosProxyConfig } from 'axios';
import FormData from 'form-data';

type FormFieldValue = string | number | boolean;

type UploadFile = {
  fieldName: string;
  filePath: string;
  filename?: string;
  contentType?: string;
};

type RequestArgs = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  formFields?: Record<string, FormFieldValue>;
  files?: UploadFile[];
  proxy?: string;
};

const isValidRequestArgs = (args: unknown): args is RequestArgs => {
  if (typeof args !== 'object' || args === null) {
    return false;
  }

  const requestArgs = args as Record<string, unknown>;

  return (
    typeof requestArgs.url === 'string' &&
    (requestArgs.method === undefined || typeof requestArgs.method === 'string') &&
    (requestArgs.headers === undefined ||
      (typeof requestArgs.headers === 'object' &&
        requestArgs.headers !== null &&
        Object.values(requestArgs.headers).every((value) => typeof value === 'string'))) &&
    (requestArgs.body === undefined || typeof requestArgs.body === 'string') &&
    (requestArgs.proxy === undefined || typeof requestArgs.proxy === 'string') &&
    (requestArgs.formFields === undefined ||
      (typeof requestArgs.formFields === 'object' &&
        requestArgs.formFields !== null &&
        Object.values(requestArgs.formFields).every(
          (value) =>
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
        ))) &&
    (requestArgs.files === undefined ||
      (Array.isArray(requestArgs.files) &&
        requestArgs.files.every((file) => {
          if (typeof file !== 'object' || file === null) {
            return false;
          }

          const uploadFile = file as Record<string, unknown>;
          return (
            typeof uploadFile.fieldName === 'string' &&
            typeof uploadFile.filePath === 'string' &&
            (uploadFile.filename === undefined || typeof uploadFile.filename === 'string') &&
            (uploadFile.contentType === undefined || typeof uploadFile.contentType === 'string')
          );
        })))
  );
};

const buildProxyConfig = (url: string, proxy?: string): AxiosProxyConfig | undefined => {
  if (proxy) {
    const proxyUrl = new URL(proxy);
    const config: AxiosProxyConfig = {
      host: proxyUrl.hostname,
      port: parseInt(proxyUrl.port, 10),
      protocol: proxyUrl.protocol.replace(':', ''),
    };

    if (proxyUrl.username && proxyUrl.password) {
      config.auth = {
        username: proxyUrl.username,
        password: proxyUrl.password,
      };
    }

    return config;
  }

  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const noProxy = process.env.NO_PROXY || process.env.no_proxy;

  const shouldSkipProxy = (targetUrl: string) => {
    if (!noProxy) {
      return false;
    }

    const noProxyList = noProxy.split(',').map((host) => host.trim().toLowerCase());
    try {
      const urlObj = new URL(targetUrl);
      const hostname = urlObj.hostname.toLowerCase();
      return noProxyList.some(
        (pattern) =>
          pattern === hostname || hostname.endsWith(`.${pattern}`) || pattern === '*'
      );
    } catch {
      return false;
    }
  };

  if (shouldSkipProxy(url)) {
    return undefined;
  }

  const proxyUrlStr = url.startsWith('https:') ? httpsProxy : httpProxy;
  if (!proxyUrlStr) {
    return undefined;
  }

  try {
    const proxyUrl = new URL(proxyUrlStr);
    const config: AxiosProxyConfig = {
      host: proxyUrl.hostname,
      port: parseInt(proxyUrl.port, 10) || (proxyUrl.protocol === 'https:' ? 443 : 80),
      protocol: proxyUrl.protocol.replace(':', ''),
    };

    if (proxyUrl.username && proxyUrl.password) {
      config.auth = {
        username: proxyUrl.username,
        password: proxyUrl.password,
      };
    }

    return config;
  } catch {
    console.warn('Invalid proxy environment variable:', proxyUrlStr);
    return undefined;
  }
};

const buildRequestPayload = (args: RequestArgs) => {
  const hasFormFields = Boolean(args.formFields && Object.keys(args.formFields).length > 0);
  const hasFiles = Boolean(args.files && args.files.length > 0);

  if (args.body !== undefined && (hasFormFields || hasFiles)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'body cannot be used together with formFields or files'
    );
  }

  const requestHeaders = { ...(args.headers ?? {}) };

  if (!hasFormFields && !hasFiles) {
    return {
      data: args.body,
      headers: requestHeaders,
    };
  }

  const form = new FormData();

  if (args.formFields) {
    for (const [key, value] of Object.entries(args.formFields)) {
      form.append(key, String(value));
    }
  }

  if (args.files) {
    for (const file of args.files) {
      if (!fs.existsSync(file.filePath)) {
        throw new McpError(ErrorCode.InvalidParams, `File does not exist: ${file.filePath}`);
      }

      form.append(file.fieldName, fs.createReadStream(file.filePath), {
        filename: file.filename ?? path.basename(file.filePath),
        contentType: file.contentType,
      });
    }
  }

  return {
    data: form,
    headers: {
      ...requestHeaders,
      ...form.getHeaders(),
    },
  };
};

class ApiRequestServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'api-request-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'send_api_request',
          description:
            'Send an HTTP request and return a JSON response. Supports proxy, raw body, and multipart uploads.',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'Request URL. Supports http and https.',
              },
              method: {
                type: 'string',
                description: 'HTTP method, such as GET, POST, PUT, DELETE.',
                default: 'GET',
                enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
              },
              headers: {
                type: 'object',
                description: 'Request headers.',
                additionalProperties: {
                  type: 'string',
                },
              },
              body: {
                type: 'string',
                description: 'Raw request body for JSON or other text payloads.',
              },
              formFields: {
                type: 'object',
                description: 'Multipart form fields. Values support string, number, and boolean.',
                additionalProperties: {
                  anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
                },
              },
              files: {
                type: 'array',
                description: 'Multipart files to upload from local disk.',
                items: {
                  type: 'object',
                  properties: {
                    fieldName: {
                      type: 'string',
                      description: 'Multipart field name.',
                    },
                    filePath: {
                      type: 'string',
                      description: 'Local file path.',
                    },
                    filename: {
                      type: 'string',
                      description: 'Optional filename sent to the remote server.',
                    },
                    contentType: {
                      type: 'string',
                      description: 'Optional content type for the file.',
                    },
                  },
                  required: ['fieldName', 'filePath'],
                },
              },
              proxy: {
                type: 'string',
                description: 'Proxy server, for example http://proxy.example.com:8080.',
              },
            },
            required: ['url'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'send_api_request') {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }

      if (!isValidRequestArgs(request.params.arguments)) {
        throw new McpError(ErrorCode.InvalidParams, 'Invalid request arguments');
      }

      const args = request.params.arguments;

      try {
        const proxyConfig = buildProxyConfig(args.url, args.proxy);
        const payload = buildRequestPayload(args);

        const response = await axios({
          url: args.url,
          method: (args.method ?? 'GET') as any,
          headers: payload.headers,
          data: payload.data,
          proxy: proxyConfig,
          timeout: 30000,
          validateStatus: () => true,
        });

        let responseData: unknown;
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          responseData = response.data;
        } else {
          try {
            responseData =
              typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
          } catch {
            return {
              content: [
                {
                  type: 'text',
                  text: `Response is not valid JSON. Status: ${response.status}, content-type: ${contentType}, body: ${JSON.stringify(response.data)}`,
                },
              ],
              isError: true,
            };
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  data: responseData,
                  status: response.status,
                  statusText: response.statusText,
                  headers: response.headers,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const statusText = error.response?.statusText;
          const data = error.response?.data;

          return {
            content: [
              {
                type: 'text',
                text: `Request failed: ${error.message}${status ? ` (status: ${status} ${statusText})` : ''}${data ? `\nResponse data: ${JSON.stringify(data)}` : ''}`,
              },
            ],
            isError: true,
          };
        }

        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('API request MCP server running on stdio');
  }
}

const server = new ApiRequestServer();
server.run().catch(console.error);
