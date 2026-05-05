# Landing Page

一个基于 Cloudflare Pages 的快速链接导航页面，支持通过 API 动态添加链接，并通过简洁的路径快速跳转。

## 功能特点

- **IPv6 切换**: 支持配置 IPv4/IPv6 双地址，前端一键切换跳转
- **增量更新**: 支持仅修改指定字段，无需覆盖整个对象
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
| name | string | 是 | 链接名称（用作主键） |
| url  | string | 创建时必填 | 目标 URL (IPv4) |
| v6_url | string | 否 | 目标 URL (IPv6) |
| icon | string | 否 | 自定义图标 URL，不提供则自动抓取 |

**示例 (创建):**
```bash
curl -X POST http://localhost:8788/api/urls \
  -H "Content-Type: application/json" \
  -d '{"name": "google", "url": "https://google.com", "v6_url": "https://ipv6.google.com"}'
```

**示例 (增量更新):**
```bash
curl -X POST http://localhost:8788/api/urls \
  -H "Content-Type: application/json" \
  -d '{"name": "google", "v6_url": "https://new-ipv6.google.com"}'
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

支持删除单个或批量删除多个链接。

**Request Body (单个):**
```json
{ "name": "google" }
```

**Request Body (批量):**
```json
{ "names": ["google", "github"] }
```

**示例 (单个):**
```bash
curl -X DELETE http://localhost:8788/api/urls \
  -H "Content-Type: application/json" \
  -d '{"name": "google"}'
```

**示例 (批量):**
```bash
curl -X DELETE http://localhost:8788/api/urls \
  -H "Content-Type: application/json" \
  -d '{"names": ["google", "github"]}'
```

**响应:**
```json
{
  "success": true,
  "results": [
    { "name": "google", "status": "deleted" },
    { "name": "github", "status": "deleted" }
  ],
  "errors": []
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

## 前端使用

在主页面上，每个链接卡片右上角悬停时会显示 **Delete** 按钮，点击即可删除该链接。

## 注意事项

- **增量更新**: POST 请求仅更新提供的字段，未提供的字段保持不变
- **IPv6 切换**: 前端 Toggle 开启后，点击卡片将优先跳转 `v6_url`
- **KV 存储延迟**: Cloudflare KV 存在最终一致性，写入后可能需要几秒才能在全球节点同步
- **Base64 图标**: 自动获取的 favicon 会转为 base64 存储在 KV 中，每个 key 最大支持 25MB
- **批量操作**: POST 和 DELETE 支持批量处理，部分失败时返回 `207 Multi-Status` 状态码

## 技术栈

- **Cloudflare Pages** - 静态托管与边缘计算
- **Cloudflare KV** - 键值存储
- **TypeScript** - 类型安全的 API 逻辑
- **原生 HTML/CSS** - 轻量级前端界面
