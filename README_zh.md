# OpenWeatherMap MCP 服务器

[English](README.md) | [中文](README_zh.md)

一个基于 Model Context Protocol (MCP) 的 OpenWeatherMap API 集成服务器，为 AI 助手提供全面的天气数据访问能力。

## 🌟 功能特性

### 核心天气功能
- **🌡️ 当前天气查询** - 获取实时天气数据，包括温度、湿度、风速、气压等
- **📅 天气预报** - 5天/3小时间隔的详细天气预报，含趋势分析
- **🏭 空气质量监测** - 实时空气质量指数和污染物浓度数据
- **🗺️ 天气地图** - 多图层天气地图瓦片（云层、降水、温度等）
- **⚠️ 天气警报** - 政府发布的天气预警和安全建议
- **📊 历史天气** - 历史天气数据查询和多日对比分析

### 智能城市名查询
- **🧠 智能回退** - 自动处理中英文城市名
- **🔄 自动地理编码** - 当直接城市名查询失败时，自动使用地理编码获取坐标
- **🌍 通用支持** - 通过地理编码API支持任何语言的城市名

### 辅助功能
- **🌍 地理编码** - 地名转坐标，支持模糊搜索
- **📍 反向地理编码** - 坐标转地名，获取位置信息
- **🔄 多单位支持** - 公制、英制、标准单位系统
- **🌐 多语言支持** - 中文、英文等多种语言

## 📦 安装

### 前置要求
- Node.js 18.0.0 或更高版本
- OpenWeatherMap API 密钥

### 获取 API 密钥
1. 访问 [OpenWeatherMap](https://openweathermap.org/api)
2. 注册账户并获取免费 API 密钥
3. 设置环境变量：
   ```bash
   export OPENWEATHER_API_KEY="your_api_key_here"
   ```

### 安装方式

#### 方式一：NPM 全局安装
```bash
npm install -g openweather-mcp
```

#### 方式二：从源码构建
```bash
git clone https://github.com/QianJue-CN/OpenWeatherMCP.git
cd OpenWeatherMCP
npm install
npm run build
```

## 🚀 使用方法

### 作为 MCP 服务器运行
```bash
# 设置 API 密钥
export OPENWEATHER_API_KEY="your_api_key_here"

# 启动服务器
npx openweather-mcp
```

### 在 Claude Desktop 中配置
在 Claude Desktop 的配置文件中添加：

```json
{
  "mcpServers": {
    "openweather": {
      "command": "npx",
      "args": ["openweather-mcp"],
      "env": {
        "OPENWEATHER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 在其他 MCP 客户端中使用
任何支持 MCP 协议的客户端都可以连接到此服务器。

## 🛠️ 可用工具

### 1. 当前天气查询 (`get_current_weather`)
获取指定位置的实时天气信息。

**参数：**
- `city` (可选): 城市名称，如 "北京" 或 "Beijing" 或 "Beijing,CN"
- `lat` (可选): 纬度 (-90 到 90)
- `lon` (可选): 经度 (-180 到 180)
- `zip` (可选): 邮政编码，如 "10001,US"
- `units` (可选): 单位系统 (metric/imperial/standard)
- `lang` (可选): 语言代码 (zh_cn/en/es/fr/de/ja/ko/ru)

**智能城市名支持：**
- ✅ "北京"（中文）→ 自动工作
- ✅ "Beijing"（英文）→ 自动工作
- ✅ "上海"（中文）→ 自动工作
- ✅ "Shanghai"（英文）→ 自动工作

**示例：**
```json
{
  "city": "北京",
  "units": "metric",
  "lang": "zh_cn"
}
```

### 2. 天气预报 (`get_weather_forecast`)
获取5天天气预报数据。

**参数：**
- 位置参数同上
- `cnt` (可选): 预报时间点数量 (最多40个)

**示例：**
```json
{
  "lat": 39.9042,
  "lon": 116.4074,
  "cnt": 16,
  "units": "metric"
}
```

### 3. 空气质量 (`get_air_quality`)
获取空气质量数据。

**参数：**
- `lat`: 纬度
- `lon`: 经度

### 4. 天气地图 (`get_weather_map`)
获取天气地图瓦片。

**参数：**
- `layer`: 图层类型 (clouds_new/precipitation_new/pressure_new/wind_new/temp_new)
- `z`: 缩放级别 (0-10)
- `x`: 瓦片 X 坐标
- `y`: 瓦片 Y 坐标

### 5. 天气警报 (`get_weather_alerts`)
获取天气预警信息。

**参数：**
- `lat`: 纬度
- `lon`: 经度

### 6. 历史天气 (`get_historical_weather`)
查询历史天气数据。

**参数：**
- `lat`: 纬度
- `lon`: 经度
- `dt`: 查询日期的 Unix 时间戳
- `units`: 单位系统
- `lang`: 语言代码

### 7. 地理编码 (`geocoding`)
根据地名获取坐标。

**参数：**
- `q`: 位置查询字符串
- `limit`: 返回结果数量 (1-5)

### 8. 反向地理编码 (`reverse_geocoding`)
根据坐标获取地名。

**参数：**
- `lat`: 纬度
- `lon`: 经度
- `limit`: 返回结果数量 (1-5)

## 📝 使用示例

### 查询北京当前天气
```json
{
  "tool": "get_current_weather",
  "parameters": {
    "city": "北京",
    "units": "metric",
    "lang": "zh_cn"
  }
}
```

### 获取上海5天天气预报
```json
{
  "tool": "get_weather_forecast",
  "parameters": {
    "city": "上海",
    "units": "metric",
    "lang": "zh_cn"
  }
}
```

### 查询空气质量
```json
{
  "tool": "get_air_quality",
  "parameters": {
    "lat": 39.9042,
    "lon": 116.4074
  }
}
```

## 🌍 智能城市名查询工作原理

1. **直接查询**：首先尝试使用提供的城市名直接查询天气
2. **自动回退**：如果直接查询失败（404错误），自动触发地理编码
3. **坐标转换**：通过地理编码API将城市名转换为精确坐标
4. **重新查询**：使用获取的坐标重新查询天气数据
5. **无缝体验**：整个过程对用户透明，无需手动处理

这意味着您可以使用任何语言的城市名：
- 中文：北京、上海、广州、深圳
- 英文：Beijing、Shanghai、Guangzhou、Shenzhen
- 其他语言：東京、ソウル、Paris、London

## 🔧 开发

### 项目结构
```
src/
├── index.ts              # MCP 服务器入口
├── types/
│   ├── weather.ts        # 天气数据类型定义
│   └── mcp.ts           # MCP 工具类型定义
├── services/
│   └── openweather.ts   # OpenWeatherMap API 服务
└── tools/
    ├── current-weather.ts    # 当前天气工具
    ├── forecast.ts          # 天气预报工具
    ├── air-pollution.ts     # 空气质量工具
    ├── weather-maps.ts      # 天气地图工具
    ├── weather-alerts.ts    # 天气警报工具
    └── historical-weather.ts # 历史天气工具
```

### 构建和测试
```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 开发模式（监听文件变化）
npm run dev

# 运行测试
npm test

# 代码检查
npm run lint
```

## ⚠️ 注意事项

1. **API 限制**: 免费账户有调用次数限制，请合理使用
2. **历史数据**: 历史天气数据需要付费订阅
3. **One Call API**: 天气警报功能需要 One Call API 3.0 订阅
4. **网络连接**: 确保服务器能够访问 OpenWeatherMap API

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [OpenWeatherMap API 文档](https://openweathermap.org/api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/desktop)
- [项目 GitHub 仓库](https://github.com/QianJue-CN/OpenWeatherMCP)
