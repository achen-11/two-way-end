# 通识课程选课系统

技术栈: Midway Hooks | Vue3 | TypeScript | Ant-Design-Vue | Tailwind | Redis | MySQL

## 项目结构说明
```
├── api                    // 服务端 api 文件夹
│   ├── configuration.ts   // 服务端配置文件
│   ├── middle             // 中间件
│   ├── service            // 业务接口
│   └── utils              // 服务端-工具库
├── router                 // 前端-路由
│   └── index.ts
├── store                  
│   └── store.ts
├── styles
├── utils   
│   └── index.ts           // 前端-工具库
│   ├── permission.ts      // 前端-鉴权流程
│   └── types.ts           // 全局-ts类型声明
└── view                   // 前端-业务文件
```