#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosProxyConfig } from 'axios';

// 参数验证函数
const isValidRequestArgs = (
  args: any
): args is {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  proxy?: string;
} =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.url === 'string' &&
  (args.method === undefined || typeof args.method === 'string') &&
  (args.headers === undefined || (typeof args.headers === 'object' && args.headers !== null)) &&
  (args.body === undefined || typeof args.body === 'string') &&
  (args.proxy === undefined || typeof args.proxy === 'string');

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

    // 错误处理
    this.server.onerror = (error) => console.error('[MCP 错误]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'send_api_request', // 唯一标识符
          description: '发送API请求并返回JSON响应，支持多种协议和代理', // 人可读描述
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: '请求的URL，支持http和https协议',
              },
              method: {
                type: 'string',
                description: 'HTTP方法，如GET, POST, PUT, DELETE等',
                default: 'GET',
                enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
              },
              headers: {
                type: 'object',
                description: '请求头对象，键值对',
                additionalProperties: {
                  type: 'string',
                },
              },
              body: {
                type: 'string',
                description: '请求体内容，对于POST等方法',
              },
              proxy: {
                type: 'string',
                description: '代理服务器地址，格式如 http://proxy.example.com:8080',
              },
            },
            required: ['url'], // 必需参数
          },
        },
      ],
    }));

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'send_api_request') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `未知工具: ${request.params.name}`
        );
      }

      if (!isValidRequestArgs(request.params.arguments)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          '无效的请求参数'
        );
      }

      const { url, method = 'GET', headers = {}, body, proxy } = request.params.arguments;

      try {
        // 解析代理配置 - 优先使用参数指定的代理，其次使用环境变量
        let proxyConfig: AxiosProxyConfig | undefined;
        if (proxy) {
          // 使用参数指定的代理
          const proxyUrl = new URL(proxy);
          proxyConfig = {
            host: proxyUrl.hostname,
            port: parseInt(proxyUrl.port, 10),
            protocol: proxyUrl.protocol.replace(':', ''),
          };
          if (proxyUrl.username && proxyUrl.password) {
            proxyConfig.auth = {
              username: proxyUrl.username,
              password: proxyUrl.password,
            };
          }
        } else {
          // 使用环境变量中的代理配置
          const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
          const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
          const noProxy = process.env.NO_PROXY || process.env.no_proxy;

          // 检查是否在no_proxy列表中
          const shouldSkipProxy = (url: string) => {
            if (!noProxy) return false;
            const noProxyList = noProxy.split(',').map(host => host.trim().toLowerCase());
            try {
              const urlObj = new URL(url);
              const hostname = urlObj.hostname.toLowerCase();
              return noProxyList.some(pattern =>
                pattern === hostname ||
                hostname.endsWith('.' + pattern) ||
                pattern === '*'
              );
            } catch {
              return false;
            }
          };

          if (!shouldSkipProxy(url)) {
            const proxyUrlStr = url.startsWith('https:') ? httpsProxy : httpProxy;
            if (proxyUrlStr) {
              try {
                const proxyUrl = new URL(proxyUrlStr);
                proxyConfig = {
                  host: proxyUrl.hostname,
                  port: parseInt(proxyUrl.port, 10) || (proxyUrl.protocol === 'https:' ? 443 : 80),
                  protocol: proxyUrl.protocol.replace(':', ''),
                };
                if (proxyUrl.username && proxyUrl.password) {
                  proxyConfig.auth = {
                    username: proxyUrl.username,
                    password: proxyUrl.password,
                  };
                }
              } catch (error) {
                console.warn('无效的代理环境变量:', proxyUrlStr);
              }
            }
          }
        }

        // 发送请求
        const response = await axios({
          url,
          method: method as any,
          headers,
          data: body,
          proxy: proxyConfig,
          timeout: 30000, // 30秒超时
          validateStatus: () => true, // 不抛出HTTP错误，由我们处理
        });

        // 验证响应是否为JSON
        let responseData: any;
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          responseData = response.data;
        } else {
          // 尝试解析为JSON
          try {
            if (typeof response.data === 'string') {
              responseData = JSON.parse(response.data);
            } else {
              responseData = response.data;
            }
          } catch (parseError) {
            return {
              content: [
                {
                  type: 'text',
                  text: `响应不是有效的JSON格式。状态码: ${response.status}, 内容类型: ${contentType}, 响应内容: ${JSON.stringify(response.data)}`,
                },
              ],
              isError: true,
            };
          }
        }

        // 返回格式化的JSON响应
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: responseData,
              }, null, 2),
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
                text: `请求失败: ${error.message}${status ? ` (状态码: ${status} ${statusText})` : ''}${data ? `\n响应数据: ${JSON.stringify(data)}` : ''}`,
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
    console.error('API请求MCP服务器已在stdio上运行');
  }
}

const server = new ApiRequestServer();
server.run().catch(console.error);
