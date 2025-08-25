# OpenWeatherMap MCP 服务器部署指南

本指南详细说明如何在不同环境中部署 OpenWeatherMap MCP 服务器。

## 📋 部署前准备

### 1. 获取 OpenWeatherMap API 密钥

1. 访问 [OpenWeatherMap](https://openweathermap.org/api)
2. 注册账户（免费）
3. 在 API Keys 页面生成新的 API 密钥
4. 记录您的 API 密钥，稍后需要配置

### 2. 系统要求

- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **操作系统**: Windows, macOS, Linux
- **内存**: 最少 512MB RAM
- **存储**: 最少 100MB 可用空间

## 🚀 部署方式

### 方式一：本地开发部署

```bash
# 1. 克隆项目
git clone https://github.com/your-org/openweather-mcp.git
cd openweather-mcp

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 设置环境变量
export OPENWEATHER_API_KEY="your_api_key_here"

# 5. 启动服务器
npm start
```

### 方式二：全局安装

```bash
# 1. 全局安装
npm install -g openweather-mcp

# 2. 设置环境变量
export OPENWEATHER_API_KEY="your_api_key_here"

# 3. 启动服务器
openweather-mcp
```

### 方式三：Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 暴露端口（如果需要）
EXPOSE 3000

# 设置启动命令
CMD ["npm", "start"]
```

构建和运行：

```bash
# 构建镜像
docker build -t openweather-mcp .

# 运行容器
docker run -e OPENWEATHER_API_KEY="your_api_key" openweather-mcp
```

## 🔧 客户端配置

### Claude Desktop 配置

#### Windows 配置

1. 打开文件资源管理器
2. 导航到 `%APPDATA%\Claude\`
3. 编辑或创建 `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "openweather": {
      "command": "node",
      "args": ["C:\\path\\to\\openweather-mcp\\dist\\index.js"],
      "env": {
        "OPENWEATHER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### macOS 配置

1. 打开终端
2. 编辑配置文件：

```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

```json
{
  "mcpServers": {
    "openweather": {
      "command": "node",
      "args": ["/path/to/openweather-mcp/dist/index.js"],
      "env": {
        "OPENWEATHER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Linux 配置

```bash
# 创建配置目录
mkdir -p ~/.config/claude

# 编辑配置文件
nano ~/.config/claude/claude_desktop_config.json
```

```json
{
  "mcpServers": {
    "openweather": {
      "command": "node",
      "args": ["/path/to/openweather-mcp/dist/index.js"],
      "env": {
        "OPENWEATHER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 其他 MCP 客户端

对于其他支持 MCP 协议的客户端，请参考其文档配置 MCP 服务器连接。

## 🔒 安全配置

### 环境变量管理

**推荐方式 - 使用 .env 文件：**

```bash
# 创建 .env 文件
echo "OPENWEATHER_API_KEY=your_api_key_here" > .env

# 确保 .env 文件不被提交到版本控制
echo ".env" >> .gitignore
```

**系统环境变量：**

```bash
# Linux/macOS
export OPENWEATHER_API_KEY="your_api_key_here"
echo 'export OPENWEATHER_API_KEY="your_api_key_here"' >> ~/.bashrc

# Windows (PowerShell)
$env:OPENWEATHER_API_KEY="your_api_key_here"
[Environment]::SetEnvironmentVariable("OPENWEATHER_API_KEY", "your_api_key_here", "User")
```

### API 密钥安全

1. **不要在代码中硬编码 API 密钥**
2. **使用环境变量或密钥管理服务**
3. **定期轮换 API 密钥**
4. **监控 API 使用情况**
5. **设置使用限制和警报**

## 📊 监控和日志

### 基本监控

```bash
# 检查服务器状态
ps aux | grep openweather-mcp

# 查看资源使用
top -p $(pgrep -f openweather-mcp)
```

### 日志配置

服务器日志会输出到标准错误流，可以重定向到文件：

```bash
# 启动并记录日志
npm start 2> openweather-mcp.log

# 实时查看日志
tail -f openweather-mcp.log
```

### 性能监控

```bash
# 安装性能监控工具
npm install -g clinic

# 性能分析
clinic doctor -- node dist/index.js
```

## 🔄 更新和维护

### 更新服务器

```bash
# 拉取最新代码
git pull origin main

# 重新安装依赖
npm install

# 重新构建
npm run build

# 重启服务器
npm start
```

### 备份配置

```bash
# 备份配置文件
cp claude_desktop_config.json claude_desktop_config.json.backup

# 备份环境变量
env | grep OPENWEATHER > openweather.env.backup
```

## 🚨 故障排除

### 常见问题

**服务器无法启动：**
```bash
# 检查 Node.js 版本
node --version

# 检查依赖
npm list

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

**API 连接失败：**
```bash
# 测试 API 密钥
curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY"

# 检查网络连接
ping api.openweathermap.org
```

**客户端连接失败：**
1. 检查配置文件路径是否正确
2. 验证 JSON 格式是否有效
3. 确认服务器进程正在运行
4. 检查环境变量是否设置

### 调试模式

```bash
# 启用详细日志
DEBUG=* npm start

# 或者设置特定的调试级别
DEBUG=openweather:* npm start
```

## 📈 性能优化

### 生产环境优化

```bash
# 使用 PM2 进程管理
npm install -g pm2

# 启动服务
pm2 start dist/index.js --name openweather-mcp

# 设置开机自启
pm2 startup
pm2 save
```

### 缓存配置

考虑添加 Redis 缓存来减少 API 调用：

```javascript
// 示例缓存配置
const redis = require('redis');
const client = redis.createClient();

// 缓存天气数据 5 分钟
const CACHE_TTL = 300;
```

## 🔗 相关资源

- [OpenWeatherMap API 限制](https://openweathermap.org/price)
- [Node.js 部署最佳实践](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PM2 进程管理](https://pm2.keymetrics.io/)
- [Docker 部署指南](https://docs.docker.com/get-started/)
