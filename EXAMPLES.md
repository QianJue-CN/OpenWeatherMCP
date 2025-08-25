# OpenWeatherMap MCP 服务器使用示例

本文档提供了 OpenWeatherMap MCP 服务器的详细使用示例。

## 🚀 快速开始

### 1. 安装和配置

```bash
# 克隆或下载项目
git clone https://github.com/your-org/openweather-mcp.git
cd openweather-mcp

# 安装依赖
npm install

# 构建项目
npm run build

# 设置 API 密钥
export OPENWEATHER_API_KEY="your_openweathermap_api_key"

# 启动服务器
npm start
```

### 2. 在 Claude Desktop 中配置

编辑 Claude Desktop 配置文件：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "openweather": {
      "command": "node",
      "args": ["path/to/openweather-mcp/dist/index.js"],
      "env": {
        "OPENWEATHER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 🛠️ 工具使用示例

### 1. 当前天气查询

**通过城市名称查询：**
```
请查询北京的当前天气
```

**通过坐标查询：**
```
请查询坐标 39.9042, 116.4074 的当前天气
```

**通过邮政编码查询：**
```
请查询邮政编码 10001,US 的当前天气
```

### 2. 天气预报

**5天天气预报：**
```
请获取上海的5天天气预报
```

**限制预报点数：**
```
请获取纽约未来24小时的天气预报（8个数据点）
```

### 3. 空气质量查询

**当前空气质量：**
```
请查询北京（39.9042, 116.4074）的当前空气质量
```

**空气质量预报：**
```
请获取上海的空气质量预报
```

### 4. 天气地图

**获取云层地图：**
```
请获取缩放级别5，坐标(16,10)的云层地图
```

**获取降水地图：**
```
请获取北京地区的降水分布地图
```

### 5. 天气警报

**查询天气警报：**
```
请查询北京地区的天气警报
```

### 6. 历史天气

**查询历史天气：**
```
请查询2023年1月1日北京的历史天气
```

### 7. 地理编码

**地名转坐标：**
```
请查询"北京"的地理坐标
```

**坐标转地名：**
```
请查询坐标 39.9042, 116.4074 对应的地名
```

## 📊 响应示例

### 当前天气响应示例

```
🌍 **北京, CN** 当前天气

🌡️ **温度**: 15°C (体感 13°C)
📊 **温度范围**: 12°C ~ 18°C
☁️ **天气**: 多云
💧 **湿度**: 65%
🌬️ **风速**: 3.2 m/s 东北
📏 **气压**: 1015 hPa
👁️ **能见度**: 10.0 km
☁️ **云量**: 75%

🌅 **日出**: 2024-01-15 07:25:30
🌇 **日落**: 2024-01-15 17:15:45

📍 **坐标**: 39.9042, 116.4074
🕐 **更新时间**: 2024-01-15 14:30:00
```

### 空气质量响应示例

```
🌍 **空气质量报告**
📍 **坐标**: 39.9042, 116.4074

🟡 **空气质量指数**: 3 (中等)

🧪 **污染物浓度** (μg/m³):
• CO (一氧化碳): 1200.50
• NO (一氧化氮): 45.30
• NO₂ (二氧化氮): 85.20
• O₃ (臭氧): 120.80
• SO₂ (二氧化硫): 25.60
• PM2.5: 55.40
• PM10: 85.70
• NH₃ (氨气): 15.20

🎯 **主要污染物**: PM2.5 (55.40 μg/m³)

💡 **健康建议**:
• 空气质量中等，敏感人群应减少户外活动
• 建议关闭门窗，使用空气净化器
```

## 🔧 高级配置

### 自定义单位和语言

```javascript
// 在工具调用中指定参数
{
  "city": "Tokyo",
  "units": "imperial",  // 华氏度
  "lang": "en"         // 英语
}
```

### 批量查询示例

```javascript
// 可以连续调用多个工具
1. 查询当前天气
2. 获取天气预报
3. 检查空气质量
4. 查看天气警报
```

## 🚨 错误处理

### 常见错误及解决方案

**API 密钥无效：**
```
错误: OpenWeatherMap API Error (401): Invalid API key
解决: 检查 OPENWEATHER_API_KEY 环境变量是否正确设置
```

**位置未找到：**
```
错误: OpenWeatherMap API Error (404): city not found
解决: 检查城市名称拼写，或使用坐标查询
```

**请求频率限制：**
```
错误: OpenWeatherMap API Error (429): Too Many Requests
解决: 等待一段时间后重试，或升级API计划
```

## 📈 性能优化建议

1. **缓存结果**: 对于相同位置的查询，可以缓存结果避免重复请求
2. **批量查询**: 尽量合并相关的查询请求
3. **选择合适的数据点**: 天气预报可以限制数据点数量
4. **使用坐标**: 坐标查询比城市名称查询更精确和快速

## 🔗 相关链接

- [OpenWeatherMap API 文档](https://openweathermap.org/api)
- [获取免费 API 密钥](https://openweathermap.org/price)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Claude Desktop 下载](https://claude.ai/desktop)
