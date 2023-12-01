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

## 表结构
见`/prisma/schema.prisam`


## 选课限制规则说明

1. 专业限制:  course_id 关联 course_major_limit, 根据 major_id 进行限制
  - 通过管理后台-课程管理进行配置

2. 学生类型限制:
  - 专升本: 不限制选课门数
  - 本科: 大一大二限选两门, 大三大四不限制

3. 高级课程限制: 阶段/年级限制
  - 通过管理后台-课程管理进行配置
  - 可以指定每一门课程的每一个阶段, 指定哪些年级可选
  - (场景案例: 仅大一大二可选课程 \ 仅毕业班可选课程 \ 第一二阶段仅毕业班可选, 第三阶段全部课程 \ ...) 

4. 年级计算规则: 
  - Grade = semester_end - enroll_year

5. 历史修读限制:
  - 修读过同名课程, 不可重复修读 (需要做数据同步)
  
6. 周次限制
  - 同一时间授课时间段(周次+课程时间), 不可重复修读


## 部署FAQ
1. Prisma (初始化 & 配置更新)
> 数据库连接信息(datasource)初始化或更新也需要执行下列操作

> 数据库配置入口: ➡️ /prisma/schema.prisma
```bash
# prisma数据库初始化: (初次配置)
npx prisma db push
# 更新表结构: (更新配置)
npx prisma migrate dev
```

2. 启动端口配置
> 修改 package.json中的script可以更改启动参数, 例如修改端口
```js
// 如 start 命令
{
  "scripts": {
    "start": "hooks start --port=3001", // 表示使用 3001 端口启动
  }
}
```

3. 部署命令
```bash
git clone https://github.com/achen-11/two-way-end.git
# 需要 node 环境
npm install
npm run start
```
