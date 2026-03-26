# API请求MCP服务器

一个用于自动发送 HTTP 请求并验证 JSON 响应的 MCP (Model Context Protocol) 服务器。支持多种 HTTP 方法、代理配置，以及 `multipart/form-data` 文件上传。

## 功能特性

- 自动发送 GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS 请求
- 支持 HTTP 和 HTTPS
- 支持 HTTP/HTTPS 代理
- 自动校验响应是否为 JSON
- 支持原始文本请求体
- 支持 `multipart/form-data`
- 支持普通表单字段和本地文件同时上传

## 安装

```bash
git clone https://github.com/your-username/api-request-server.git
cd api-request-server
npm install
npm run build
```

## 配置

### 可选环境变量

```env
HTTP_PROXY=http://127.0.0.1:8080
HTTPS_PROXY=http://127.0.0.1:8080
NO_PROXY=localhost,127.0.0.1,.local
```

- `HTTP_PROXY`: HTTP 请求代理
- `HTTPS_PROXY`: HTTPS 请求代理
- `NO_PROXY`: 不走代理的主机列表

### Claude Code

配置文件位置：项目根目录 `.claude/mcp.json`

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

如果你是直接在本仓库本地开发和调试，推荐使用绝对路径或与你当前项目结构一致的相对路径，并在修改后重启客户端以重新加载 MCP 配置。

### Cline

Windows 配置文件位置：
`%APPDATA%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json`

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

本地开发时，也可以直接改成你自己的实际路径，例如：

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
        "C:\\Users\\gml\\Documents\\Cline\\MCP\\api-request-server\\build\\index.js"
      ]
    }
  }
}
```

## 使用示例

### GET

```javascript
send_api_request({
  "url": "https://api.example.com/data"
})
```

### JSON POST

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

### multipart/form-data 上传

```javascript
send_api_request({
  "url": "https://api.example.com/upload",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer your-token"
  },
  "formFields": {
    "folder": "invoices",
    "public": true,
    "userId": 123
  },
  "files": [
    {
      "fieldName": "file",
      "filePath": "C:\\data\\invoice.pdf",
      "contentType": "application/pdf"
    },
    {
      "fieldName": "attachment",
      "filePath": "C:\\data\\note.txt",
      "filename": "note.txt",
      "contentType": "text/plain"
    }
  ]
})
```

## API参数说明

### `send_api_request`

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `url` | string | 是 | 请求 URL，支持 `http://` 和 `https://` |
| `method` | string | 否 | HTTP 方法，默认 `GET` |
| `headers` | object | 否 | 请求头，键值对形式 |
| `body` | string | 否 | 原始请求体，适用于 JSON 或其他文本载荷 |
| `formFields` | object | 否 | `multipart/form-data` 普通表单字段，值支持 `string`、`number`、`boolean` |
| `files` | array | 否 | 上传文件列表，每项为 `{ fieldName, filePath, filename?, contentType? }` |
| `proxy` | string | 否 | 代理地址，格式如 `http://host:port` |

约束：

- `body` 不能和 `formFields`、`files` 同时使用
- `files[].filePath` 必须是本地真实存在的文件路径
- 上传文件时会自动生成 `multipart/form-data` 请求头

## 响应格式

成功时返回：

```json
{
  "data": {
    "key": "value"
  },
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json"
  }
}
```

失败时返回：

```json
{
  "content": [
    {
      "type": "text",
      "text": "Request failed: ..."
    }
  ],
  "isError": true
}
```

## 代理优先级

1. `proxy` 参数
2. 环境变量 `HTTP_PROXY` / `HTTPS_PROXY`
3. `NO_PROXY` 命中时不使用代理

## 注意事项

- 当前实现要求响应可解析为 JSON，否则返回错误
- 目前仅支持 HTTP 和 HTTPS 代理
- `.env` 不应提交到版本控制系统

## 开发

```bash
npm install
npm run build
npm run watch
npm start
```

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](./LICENSE)。
