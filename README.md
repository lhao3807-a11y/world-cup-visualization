# ⚽ 世界杯足球数据可视化平台

全量世界杯及国际足球赛事数据可视化交互网页，覆盖 **1872年至今** 所有国际足球赛事数据，支持 Docker 一键公网部署。

## ✨ 功能特性

- 📊 **首页数据总览** — KPI统计卡片 + 全球赛事热力图 + 冠军榜 + 进球趋势 + 赛事分布
- 📋 **历史赛事库** — 按年份、国家、赛事类型多维筛选，分页浏览全部51,000+场比赛
- 🔴 **实时赛事** — 实时比分更新模块，可配置轮询间隔（需API Key）
- ⏳ **时间轴回溯** — 可拖拽时间轴，精准查看每一年赛事数据和队伍排名
- 🏆 **队伍排名** — 基于Elo评分系统，支持按年份、指标排序
- ⚔️ **数据对比** — 两支队伍雷达图对比 + 交锋历史记录
- 📺 **可视化大屏** — 8图表全屏数据大屏，适配大屏展示
- 🌓 **暗色/亮色主题** — 一键切换，自动记忆偏好
- 📱 **响应式布局** — 完美适配PC/平板/手机

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + ECharts 5 + Element Plus + Pinia |
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 部署 | Docker + docker-compose + Nginx |

## 📦 数据说明

- **`all_matches.csv`** — 51,727 场比赛记录（1872-至今）
  - 字段：日期、主队、客队、主队进球、客队进球、赛事、举办地、中立场地
- **`countries_names.csv`** — 290 个国家/地区名称映射及配色

## 🚀 快速部署（Docker）

### 环境要求

- Docker & Docker Compose
- 2GB+ 可用内存

### 一键启动

```bash
# 1. 进入项目目录
cd 世界杯足球可视化

# 2. 构建并启动所有服务
docker compose up -d --build

# 3. 查看日志
docker compose logs -f

# 4. 浏览器访问
# 前端: http://localhost
# 后端API: http://localhost:3000/api/health
```

### 停止与重启

```bash
# 停止服务
docker compose down

# 重启服务（保留数据）
docker compose restart

# 完全清理（包括数据库）
docker compose down -v
```

### 端口配置

复制 `.env.example` 为 `.env` 并修改：

```bash
cp .env.example .env
```

默认端口：
- Web 前端：`80`
- API 后端：`3000`

## 🖥 本地开发

### 后端

```bash
cd backend
npm install
npm run seed    # 导入CSV数据
npm run dev     # 启动开发服务器 (http://localhost:3000)
```

### 前端

```bash
cd frontend
npm install
npm run dev     # 启动开发服务器 (http://localhost:5173)
```

## 📡 实时赛事配置

实时赛事功能需要对接足球数据 API：

1. 在 [football-data.org](https://www.football-data.org/) 注册获取免费 API Key
2. 配置环境变量：
```bash
FOOTBALL_API_KEY=your_api_key_here
LIVE_SYNC_ENABLED=true
```
3. 重启服务即可自动同步实时比赛数据

## 🌐 公网部署

### 使用公网服务器

1. 将项目上传至服务器
2. 安装 Docker & Docker Compose
3. 开放防火墙端口（80, 3000）
4. 运行 `docker compose up -d --build`
5. 通过 `http://服务器公网IP` 访问

### 配置域名（可选）

使用 Nginx 反向代理或修改 `frontend/nginx.conf` 中的 `server_name`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    # ...其余配置不变
}
```

## 📂 项目结构

```
世界杯足球可视化/
├── backend/                 # Express API 服务
│   ├── server.js           # 服务入口
│   ├── db.js               # SQLite 数据库
│   ├── seed.js             # 数据导入脚本
│   ├── routes/             # API 路由
│   │   ├── matches.js      # 比赛查询
│   │   ├── teams.js        # 队伍信息
│   │   ├── tournaments.js  # 赛事信息
│   │   ├── statistics.js   # 统计数据
│   │   ├── rankings.js     # 排名系统
│   │   ├── comparison.js   # 队伍对比
│   │   ├── timeline.js     # 时间轴
│   │   └── live.js         # 实时数据
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Vue 3 前端
│   ├── src/
│   │   ├── views/          # 7个页面组件
│   │   ├── components/     # 布局+图表组件
│   │   ├── stores/         # Pinia 状态管理
│   │   ├── api/            # API 客户端
│   │   ├── router/         # 路由配置
│   │   └── styles/         # 主题样式
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── all_matches.csv          # 比赛数据
├── countries_names.csv      # 国家数据
├── docker-compose.yml       # Docker 编排
├── .env.example             # 环境变量模板
└── README.md
```

## 📝 License

本项目数据来源于公开的国际足球赛事记录，仅供学习研究使用。
