# Landing Page

一个基于 Cloudflare Pages 的快速链接导航页面，支持通过 API 动态添加链接，并通过简洁的路径快速跳转。

## 功能特点

- **动态链接管理**: 通过 API 添加和管理链接
- **自动获取网站图标**: 未提供图标时自动抓取目标网站 favicon
- **快速跳转**: 通过 `/{name}` 路径直接重定向到目标 URL
- **KV 存储**: 使用 Cloudflare KV 持久化数据
- **美观界面**: 简洁现代的卡片式布局

## 项目结构

```
├── functions/
│   ├── api/
│   │   └── urls.ts      # 链接管理 API (POST/GET/DELETE)
│   └── [name].ts        # 重定向路由 /{name}
├── public/
│   └── index.html       # 前端页面
├── package.json
├── wrangler.toml
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm / bun

### 本地开发

1. 安装依赖:
```bash
npm install
```

2. 启动开发服务器:
```bash
npm run dev
```

服务将在 `http://localhost:8788` 运行。

## API 文档

### 添加链接

**POST** `/api/urls`

支持发送单个对象或对象数组（批量添加）。

**Request Body:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 链接名称（用作跳转路径） |
| url  | string | 是 | 目标 URL |
| icon | string | 否 | 自定义图标 URL，不提供则自动获取 |

**示例 (单个):**
```bash
curl -X POST http://localhost:8788/api/urls \
  -H "Content-Type: application/json" \
  -d '{"name": "google", "url": "https://google.com"}'
```

**示例 (批量):**
```bash
curl -X POST http://localhost:8788/api/urls \
  -H "Content-Type: application/json" \
  -d '[{"name": "google", "url": "https://google.com"}, {"name": "github", "url": "https://github.com"}]'
```

**响应:**
```json
{
  "success": true,
  "results": [
    { "name": "google", "status": "saved" },
    { "name": "github", "status": "saved" }
  ],
  "errors": []
}
```

### 获取所有链接

**GET** `/api/urls`

**响应:**
```json
[
  {
    "name": "google",
    "url": "https://google.com",
    "icon": "data:image/x-icon;base64,..."
  }
]
```

### 删除链接

**DELETE** `/api/urls`

**Request Body:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 要删除的链接名称 |

**示例:**
```bash
curl -X DELETE http://localhost:8788/api/urls \
  -H "Content-Type: application/json" \
  -d '{"name": "google"}'
```

**响应:**
```json
{
  "success": true,
  "message": "URL deleted successfully"
}
```

### 快速跳转

**GET** `/{name}`

根据链接名称重定向到目标 URL。

**示例:** 访问 `/google` 将重定向到 `https://google.com`

## 部署

### 1. 创建 KV Namespace

使用 Wrangler CLI:
```bash
npx wrangler kv:namespace create "URL_STORE"
```

将输出的 ID 填入 `wrangler.toml`。

### 2. 部署到 Cloudflare

```bash
npm run deploy
```

## 技术栈

- **Cloudflare Pages** - 静态托管与边缘计算
- **Cloudflare KV** - 键值存储
- **TypeScript** - 类型安全的 API 逻辑
- **原生 HTML/CSS** - 轻量级前端界面
