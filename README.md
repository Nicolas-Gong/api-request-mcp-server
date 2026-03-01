# API请求MCP服务器

一个强大的MCP (Model Context Protocol) 服务器，用于自动发送HTTP请求并验证JSON响应。支持多种协议、代理配置和中文错误提示。

## ✨ 功能特性

- 🚀 **自动API请求**: 支持GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS等HTTP方法
- 🌐 **多种协议**: 支持HTTP和HTTPS协议
- 🛡️ **JSON验证**: 自动验证响应格式，确保返回有效JSON数据
- 🔄 **代理支持**: 支持HTTP/HTTPS代理配置
- ⚡ **自动执行**: 配置后无需手动确认即可执行API请求
- 🇨🇳 **中文界面**: 所有错误信息和说明使用中文显示
- 🔧 **环境变量**: 支持通过环境变量配置代理
- 📊 **详细响应**: 返回完整的状态码、响应头和数据

## 📦 安装步骤

### 1. 下载项目

```bash
git clone https://github.com/your-username/api-request-server.git
cd api-request-server
```

### 2. 安装依赖

```bash
npm install
```

### 3. 构建项目

```bash
npm run build
```

## ⚙️ 配置方法

### 环境变量配置（可选）

代理配置是可选的。如果需要配置代理，可以通过以下方式：

**快速开始**：
1. 复制项目中的 `.env.example` 文件为 `.env`
2. 编辑 `.env` 文件，填入实际的代理信息

**配置示例**：
```env
HTTP_PROXY=http://127.0.0.1:8080
HTTPS_PROXY=http://127.0.0.1:8080
NO_PROXY=localhost,127.0.0.1,.local
```

**环境变量说明**：
- `HTTP_PROXY`: HTTP请求的代理服务器地址（可选）
- `HTTPS_PROXY`: HTTPS请求的代理服务器地址（可选）
- `NO_PROXY`: 不使用代理的主机列表，用逗号分隔（可选）

---

## 在 Cline 中使用

**文件位置**:
- Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

**配置步骤**:
1. 复制项目中的 `cline_mcp_settings.example.json` 文件
2. 编辑其中的配置信息：
   - 将 `path/to/your/api-request-server/build/index.js` 替换为实际的构建文件路径
   - 根据需要配置代理信息
3. 将配置添加到您的 `cline_mcp_settings.json` 文件中

### 在 Claude Code 中使用

**文件位置**: 项目根目录的 `.claude/mcp.json`

**配置步骤**:
1. 在项目根目录创建 `.claude` 文件夹（如果不存在）
2. 复制项目中的 `claude_mcp_settings.example.json` 文件到 `.claude/mcp.json`
3. 编辑 `.claude/mcp.json`，根据需要调整配置

**Claude Code 配置示例**:

#### 基础配置（无代理）

```json
{
  "mcpServers": {
    "api-request-server": {
      "command": "node",
      "args": [
        "./api-request-server/build/index.js"
      ]
    }
  }
}
```

#### 完整配置（包含代理）

```json
{
  "mcpServers": {
    "api-request-server": {
      "command": "node",
      "args": [
        "./api-request-server/build/index.js"
      ],
      "env": {
        "HTTP_PROXY": "http://127.0.0.1:8080",
        "HTTPS_PROXY": "http://127.0.0.1:8080",
        "NO_PROXY": "localhost,127.0.0.1,.local"
      }
    }
  }
}
```

### Cline 配置示例

#### 基础配置（无代理）

```json
{
  "mcpServers": {
    "api-request-server": {
      "autoApprove": [
        "send_api_request"
      ],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": [
        "C:\\path\\to\\api-request-server\\build\\index.js"
      ]
    }
  }
}
```

#### 完整配置（包含代理）

```json
{
  "mcpServers": {
    "api-request-server": {
      "autoApprove": [
        "send_api_request"
      ],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": [
        "C:\\path\\to\\api-request-server\\build\\index.js"
      ],
      "env": {
        "HTTP_PROXY": "http://127.0.0.1:8080",
        "HTTPS_PROXY": "http://127.0.0.1:8080",
        "NO_PROXY": "localhost,127.0.0.1,.local"
      }
    }
  }
}
```

### 环境变量说明

- `HTTP_PROXY`: HTTP请求的代理服务器地址（可选）
- `HTTPS_PROXY`: HTTPS请求的代理服务器地址（可选）
- `NO_PROXY`: 不使用代理的主机列表，用逗号分隔（可选）

### 使用说明

**Cline**:
1. 配置完成后，重启 VS Code
2. API 请求工具将在 Cline 中可用

**Claude Code**:
1. 配置完成后，重启 Claude Code 或重新加载项目
2. API 请求工具将在 Claude Code 中可用

**重要**: 请将 `C:\\path\\to\\api-request-server\\build\\index.js` 替换为实际的项目路径。

## 🚀 使用方法

### 在 Claude Code 中使用

**步骤 1：添加 MCP 服务器配置**

1. 在项目根目录创建 `.claude` 文件夹（如果不存在）
2. 复制项目中的 `claude_mcp_settings.example.json` 文件到 `.claude/mcp.json`
3. 编辑 `.claude/mcp.json`，根据需要调整配置

**配置位置**: `.claude/mcp.json`

**Claude Code 配置示例**:

#### 基础配置（无代理）

```json
{
  "mcpServers": {
    "api-request-server": {
      "command": "node",
      "args": [
        "./api-request-server/build/index.js"
      ]
    }
  }
}
```

#### 完整配置（包含代理）

```json
{
  "mcpServers": {
    "api-request-server": {
      "command": "node",
      "args": [
        "./api-request-server/build/index.js"
      ],
      "env": {
        "HTTP_PROXY": "http://127.0.0.1:8080",
        "HTTPS_PROXY": "http://127.0.0.1:8080",
        "NO_PROXY": "localhost,127.0.0.1,.local"
      }
    }
  }
}
```

**使用说明**:
1. 配置完成后，重启 Claude Code 或重新加载项目
2. API 请求工具将在 Claude Code 中可用

---

## API 调用示例

### 基本GET请求

```javascript
send_api_request({
  "url": "https://api.example.com/data"
})
```

### POST请求

```javascript
send_api_request({
  "url": "https://api.example.com/submit",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer your-token"
  },
  "body": "{\"key\": \"value\"}"
})
```

### 使用代理

```javascript
send_api_request({
  "url": "https://api.example.com/data",
  "proxy": "http://proxy-server:8080"
})
```

### 完整示例

```javascript
send_api_request({
  "url": "https://httpbin.org/post",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "User-Agent": "API-Request-MCP/1.0"
  },
  "body": "{\"test\": \"data\", \"timestamp\": \"2024-01-01\"}",
  "proxy": "http://127.0.0.1:8080"
})
```

## 📋 API参数说明

### send_api_request 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `url` | string | ✅ | 请求的URL，支持http://和https:// |
| `method` | string | ❌ | HTTP方法，默认GET。支持：GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS |
| `headers` | object | ❌ | 请求头对象，键值对形式 |
| `body` | string | ❌ | 请求体内容，POST等方法使用 |
| `proxy` | string | ❌ | 代理服务器地址，格式：http://host:port |

## 📤 响应格式

成功响应格式：

```json
{
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json",
    "server": "nginx"
  },
  "data": {
    "key": "value"
  }
}
```

错误响应格式：

```json
{
  "content": [
    {
      "type": "text",
      "text": "请求失败: 错误信息"
    }
  ],
  "isError": true
}
```

## 🔧 高级配置

### 代理配置优先级

1. **最高优先级**: 通过 `proxy` 参数直接指定
2. **中等优先级**: 环境变量配置 (HTTP_PROXY, HTTPS_PROXY)
3. **最低优先级**: 如果URL在NO_PROXY列表中，不使用代理

### 超时设置

默认超时时间为30秒，如需修改可在代码中调整：

```typescript
timeout: 30000, // 30秒
```

## ❓ 常见问题

### Q: 为什么无法选中autoApprove？
A: 这是Cline的UI限制。配置文件中正确设置后，工具会自动执行，无需手动确认。

### Q: 如何配置代理？
A: 有两种方式：
1. 在MCP配置的env中设置HTTP_PROXY和HTTPS_PROXY
2. 在API调用时通过proxy参数指定

### Q: 支持哪些代理协议？
A: 目前支持HTTP和HTTPS代理。SOCKS代理暂不支持。

### Q: 如何处理非JSON响应？
A: 工具会自动尝试解析JSON。如果响应不是有效JSON，会返回错误信息和原始响应内容。

## 📝 注意事项

1. 代理配置是可选的，不配置也可以正常使用
2. 服务器支持 HTTP 和 HTTPS 协议
3. 所有响应都会进行 JSON 验证
4. `.env` 文件不应提交到版本控制系统（已在 .gitignore 中配置）
5. 支持自定义请求头和请求体

## 🐛 故障排除

### 请求超时
- 检查网络连接
- 确认目标服务器是否可访问
- 调整超时设置（默认 30 秒）

### 代理连接失败
- 检查代理服务器地址是否正确
- 确认代理服务器是否正在运行
- 验证代理认证信息是否正确

### JSON 解析错误
- 确认响应内容是否为有效的 JSON 格式
- 检查响应的 Content-Type 是否正确
- 查看错误消息中的原始响应内容

### 请求被拒绝
- 检查请求头是否正确
- 验证认证信息（如 Authorization）
- 确认目标 API 是否支持该请求方法

## 📖 更多信息

- 查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本历史
- 查看源码中的注释了解技术细节
- 访问 [npm 包页面](https://www.npmjs.com/package/api-request-server)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发设置

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 监视文件变化
npm run watch

# 启动服务器
npm start
```

### 提交更改

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循现有的代码风格
- 添加适当的注释和文档
- 确保代码能够成功构建

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件
