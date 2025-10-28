# 就诊预约系统

本项目实现了《就诊预约系统实现文档》中描述的基于 Web 服务的就诊预约流程，包括：

- 使用 Node.js + Express 构建的 RESTful 服务端；
- 以 Fetch API 调用后端接口的单页 Web 客户端。

## 目录结构

```
.
├── server      # Node.js 服务端
└── client      # Web 客户端静态资源
```

## 快速开始

1. **安装依赖并启动服务端**

   ```bash
   cd server
   npm install
   npm start
   ```

   服务默认监听 `http://localhost:3000`。

2. **启动客户端**

   直接在浏览器中打开 `client/index.html`，即可通过页面完成预约、取消及号源查看。

## 主要接口

| 方法 | 路径                         | 描述           |
| ---- | ---------------------------- | -------------- |
| POST | `/api/appointment/book`      | 提交预约请求   |
| POST | `/api/appointment/cancel`    | 取消现有预约   |
| GET  | `/api/appointment/availability` | 查询号源情况 |

请求与响应格式请参考实现文档或服务端代码注释。

## 注意事项

- 预约日期仅允许选择「明天」与「后天」；
- 每个手机号在有效期内仅能预约一次；
- 当前实现基于内存存储，服务重启后数据会重置，如需持久化可接入数据库。
- 每个科室每日的名额可在 `server/index.js` 中的 `DEPARTMENTS` 配置修改 `maxSlots` 值，例如：

  ```javascript
  const DEPARTMENTS = {
    内科: { name: "内科", maxSlots: 3 }, // 明后两天每天 3 个号
    外科: { name: "外科", maxSlots: 2 },
  };
  ```
