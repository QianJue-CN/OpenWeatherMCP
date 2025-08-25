#!/usr/bin/env node

/**
 * OpenWeatherMap MCP 服务器入口
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { OpenWeatherMapService } from './services/openweather.js';
import { CurrentWeatherTool } from './tools/current-weather.js';
import { ForecastTool } from './tools/forecast.js';
import { AirPollutionTool } from './tools/air-pollution.js';
import { WeatherMapTool } from './tools/weather-maps.js';
import { WeatherAlertsTool } from './tools/weather-alerts.js';
import { HistoricalWeatherTool } from './tools/historical-weather.js';
// 导入类型定义（暂时注释掉未使用的）
// import { ... } from './types/mcp.js';

class OpenWeatherMCPServer {
  private server: McpServer;
  private weatherService: OpenWeatherMapService;
  private currentWeatherTool: CurrentWeatherTool;
  private forecastTool: ForecastTool;
  private airPollutionTool: AirPollutionTool;
  private weatherMapTool: WeatherMapTool;
  private weatherAlertsTool: WeatherAlertsTool;
  private historicalWeatherTool: HistoricalWeatherTool;

  constructor() {
    // 检查 API 密钥
    const apiKey = process.env['OPENWEATHER_API_KEY'];
    if (!apiKey) {
      console.error('错误: 请设置 OPENWEATHER_API_KEY 环境变量');
      console.error('获取API密钥: https://openweathermap.org/api');
      process.exit(1);
    }

    // 初始化服务
    this.weatherService = new OpenWeatherMapService({
      apiKey,
      units: 'metric',
      lang: 'zh_cn',
    });

    // 初始化工具
    this.currentWeatherTool = new CurrentWeatherTool(this.weatherService);
    this.forecastTool = new ForecastTool(this.weatherService);
    this.airPollutionTool = new AirPollutionTool(this.weatherService);
    this.weatherMapTool = new WeatherMapTool(this.weatherService);
    this.weatherAlertsTool = new WeatherAlertsTool(this.weatherService);
    this.historicalWeatherTool = new HistoricalWeatherTool(this.weatherService);

    // 创建 MCP 服务器
    this.server = new McpServer({
      name: 'openweather-mcp',
      version: '1.0.0',
    });

    this.setupTools();
    this.setupResources();
  }

  /**
   * 设置工具
   */
  private setupTools(): void {
    // 当前天气查询工具
    this.server.registerTool(
      'get_current_weather',
      {
        title: '获取当前天气',
        description: CurrentWeatherTool.getDescription(),
        inputSchema: {} as any,
      },
      async (input: any) => {
        return await this.currentWeatherTool.execute(input) as any;
      }
    );

    // 天气预报工具
    this.server.registerTool(
      'get_weather_forecast',
      {
        title: '获取天气预报',
        description: ForecastTool.getDescription(),
        inputSchema: {} as any,
      },
      async (input: any) => {
        return await this.forecastTool.execute(input) as any;
      }
    );

    // 空气质量工具
    this.server.registerTool(
      'get_air_quality',
      {
        title: '获取空气质量',
        description: AirPollutionTool.getDescription(),
        inputSchema: {} as any,
      },
      async (input: any) => {
        return await this.airPollutionTool.execute(input) as any;
      }
    );

    // 空气质量预报工具
    this.server.registerTool(
      'get_air_quality_forecast',
      {
        title: '获取空气质量预报',
        description: '获取指定坐标的空气质量预报数据',
        inputSchema: {} as any,
      },
      async (input: any) => {
        return await this.airPollutionTool.getForecast(input.lat, input.lon) as any;
      }
    );

    // 天气地图工具
    this.server.registerTool(
      'get_weather_map',
      {
        title: '获取天气地图',
        description: WeatherMapTool.getDescription(),
        inputSchema: {} as any,
      },
      async (input: any) => {
        return await this.weatherMapTool.execute(input) as any;
      }
    );

    // 区域天气地图工具
    this.server.registerTool(
      'get_region_weather_map',
      {
        title: '获取区域天气地图',
        description: '获取指定区域中心的天气地图',
        inputSchema: {} as any,
      },
      async (input: any) => {
        return await this.weatherMapTool.getRegionMap(
          input.layer,
          input.lat,
          input.lon,
          input.zoom || 5
        ) as any;
      }
    );

    // 天气警报工具
    this.server.registerTool(
      'get_weather_alerts',
      {
        title: '获取天气警报',
        description: WeatherAlertsTool.getDescription(),
        inputSchema: {} as any,
      },
      async (input: any) => {
        return await this.weatherAlertsTool.execute(input) as any;
      }
    );

    // 历史天气工具
    this.server.registerTool(
      'get_historical_weather',
      {
        title: '获取历史天气',
        description: HistoricalWeatherTool.getDescription(),
        inputSchema: {} as any,
      },
      async (input: any) => {
        return await this.historicalWeatherTool.execute(input) as any;
      }
    );

    // 地理编码工具
    this.server.registerTool(
      'geocoding',
      {
        title: '地理编码',
        description: '根据地名获取坐标信息',
        inputSchema: {} as any,
      },
      async (input: any) => {
        try {
          const results = await this.weatherService.geocoding(input.q, input.limit || 5);

          let response = `🌍 **地理编码结果**\n\n`;
          response += `🔍 **查询**: ${input.q}\n`;
          response += `📊 **结果数量**: ${results.length}\n\n`;

          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result) {
              response += `${i + 1}. **${result.name}**\n`;
              response += `   📍 坐标: ${result.lat.toFixed(4)}, ${result.lon.toFixed(4)}\n`;
              response += `   🏳️ 国家: ${result.country}\n`;
              if (result.state) {
                response += `   🏛️ 州/省: ${result.state}\n`;
              }
              response += '\n';
            }
          }

          return {
            content: [{ type: 'text', text: response }],
          } as any;
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `地理编码查询失败: ${error instanceof Error ? error.message : '未知错误'}`,
              },
            ],
            isError: true,
          } as any;
        }
      }
    );

    // 反向地理编码工具
    this.server.registerTool(
      'reverse_geocoding',
      {
        title: '反向地理编码',
        description: '根据坐标获取地名信息',
        inputSchema: {} as any,
      },
      async (input: any) => {
        try {
          const results = await this.weatherService.reverseGeocoding(
            input.lat,
            input.lon,
            input.limit || 5
          );

          let response = `🌍 **反向地理编码结果**\n\n`;
          response += `📍 **查询坐标**: ${input.lat.toFixed(4)}, ${input.lon.toFixed(4)}\n`;
          response += `📊 **结果数量**: ${results.length}\n\n`;

          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result) {
              response += `${i + 1}. **${result.name}**\n`;
              response += `   🏳️ 国家: ${result.country}\n`;
              if (result.state) {
                response += `   🏛️ 州/省: ${result.state}\n`;
              }
              response += '\n';
            }
          }

          return {
            content: [{ type: 'text', text: response }],
          } as any;
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `反向地理编码查询失败: ${error instanceof Error ? error.message : '未知错误'}`,
              },
            ],
            isError: true,
          } as any;
        }
      }
    );
  }

  /**
   * 设置资源
   */
  private setupResources(): void {
    // 可以在这里添加静态资源，如API文档、使用指南等
    this.server.registerResource(
      'weather_api_guide',
      'weather://guide',
      {
        title: 'OpenWeatherMap API 使用指南',
        description: '详细的API使用说明和示例',
        mimeType: 'text/markdown',
      },
      async () => {
        const guide = `# OpenWeatherMap MCP 服务器使用指南

## 可用工具

### 1. 当前天气查询 (get_current_weather)
获取指定位置的实时天气数据。

### 2. 天气预报 (get_weather_forecast)
获取5天天气预报，每3小时一个数据点。

### 3. 空气质量 (get_air_quality)
获取空气质量指数和污染物浓度。

### 4. 天气地图 (get_weather_map)
获取各种天气要素的地图瓦片。

### 5. 天气警报 (get_weather_alerts)
获取政府发布的天气预警信息。

### 6. 历史天气 (get_historical_weather)
查询历史天气数据。

### 7. 地理编码 (geocoding)
地名转坐标。

### 8. 反向地理编码 (reverse_geocoding)
坐标转地名。

## 环境变量配置

请确保设置了以下环境变量：
- OPENWEATHER_API_KEY: OpenWeatherMap API 密钥

## 获取API密钥

访问 https://openweathermap.org/api 注册并获取免费API密钥。
`;

        return {
          contents: [
            {
              uri: 'weather://guide',
              text: guide,
              mimeType: 'text/markdown',
            },
          ],
        };
      }
    );
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    try {
      // 验证API密钥
      console.error('正在验证 OpenWeatherMap API 密钥...');
      const isValid = await this.weatherService.validateApiKey();
      if (!isValid) {
        console.error('错误: API 密钥无效或网络连接失败');
        process.exit(1);
      }
      console.error('API 密钥验证成功');

      // 启动服务器
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('OpenWeatherMap MCP 服务器已启动');
    } catch (error) {
      console.error('启动服务器时发生错误:', error);
      process.exit(1);
    }
  }
}

// 启动服务器
const server = new OpenWeatherMCPServer();
server.start().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});
