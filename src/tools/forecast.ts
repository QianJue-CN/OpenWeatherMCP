/**
 * 天气预报工具
 */

import type { OpenWeatherMapService } from '../services/openweather.js';
import type { ForecastInput, McpToolResponse } from '../types/mcp.js';
import type { ForecastResponse, ForecastItem } from '../types/weather.js';

export class ForecastTool {
  constructor(private weatherService: OpenWeatherMapService) { }

  /**
   * 执行天气预报查询
   */
  async execute(input: ForecastInput): Promise<McpToolResponse> {
    try {
      const forecastQuery: any = {};
      if (input['city']) forecastQuery.city = input['city'];
      if (input['lat'] !== undefined) forecastQuery.lat = input['lat'];
      if (input['lon'] !== undefined) forecastQuery.lon = input['lon'];
      if (input['zip']) forecastQuery.zip = input['zip'];
      if (input['country']) forecastQuery.country = input['country'];
      if (input['cnt'] !== undefined) forecastQuery.cnt = input['cnt'];

      const forecastData = await this.weatherService.getForecast(
        forecastQuery,
        input['units'] || 'metric',
        input['lang'] || 'zh_cn'
      );

      const formattedResponse = this.formatForecastResponse(forecastData, input['units']);

      return {
        content: [
          {
            type: 'text',
            text: formattedResponse,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取天气预报数据时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 格式化天气预报响应数据
   */
  private formatForecastResponse(data: ForecastResponse, units: string): string {
    const location = `${data.city.name}, ${data.city.country}`;

    let result = `🌍 **${location}** 天气预报\n\n`;
    result += `📊 **预报数据点**: ${data.cnt} 个 (每3小时一个)\n`;
    result += `📍 **坐标**: ${data.city.coord.lat.toFixed(4)}, ${data.city.coord.lon.toFixed(4)}\n\n`;

    // 按日期分组预报数据
    const groupedByDate = this.groupForecastByDate(data.list);

    for (const [date, forecasts] of Object.entries(groupedByDate)) {
      result += `📅 **${date}**\n`;
      result += '─'.repeat(50) + '\n';

      for (const forecast of forecasts) {
        result += this.formatSingleForecast(forecast, units, data.city.timezone);
        result += '\n';
      }
      result += '\n';
    }

    // 添加总体趋势分析
    result += this.generateTrendAnalysis(data.list, units);

    return result;
  }

  /**
   * 按日期分组预报数据
   */
  private groupForecastByDate(forecasts: ForecastItem[]): Record<string, ForecastItem[]> {
    const grouped: Record<string, ForecastItem[]> = {};

    for (const forecast of forecasts) {
      const date = new Date(forecast.dt * 1000);
      const dateKey = date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(forecast);
    }

    return grouped;
  }

  /**
   * 格式化单个预报数据
   */
  private formatSingleForecast(forecast: ForecastItem, units: string, timezone: number): string {
    const time = this.weatherService.formatDateTime(forecast.dt, timezone);
    const temperature = this.weatherService.formatTemperature(forecast.main.temp, units as any);
    const feelsLike = this.weatherService.formatTemperature(forecast.main.feels_like, units as any);
    const windSpeed = this.weatherService.formatWindSpeed(forecast.wind.speed, units as any);
    const windDirection = this.getWindDirection(forecast.wind.deg);

    let result = `🕐 **${time.split(' ')[1]}** - ${forecast.weather[0]?.description || '未知'}\n`;
    result += `   🌡️ ${temperature} (体感 ${feelsLike}) | 💧 ${forecast.main.humidity}% | 🌬️ ${windSpeed} ${windDirection}\n`;
    result += `   ☁️ ${forecast.clouds.all}% | 📏 ${forecast.main.pressure} hPa | 🌧️ ${Math.round(forecast.pop * 100)}%`;

    // 降水信息
    if (forecast.rain?.['3h']) {
      result += ` | 🌧️ ${forecast.rain['3h']} mm`;
    }
    if (forecast.snow?.['3h']) {
      result += ` | ❄️ ${forecast.snow['3h']} mm`;
    }

    return result;
  }

  /**
   * 生成趋势分析
   */
  private generateTrendAnalysis(forecasts: ForecastItem[], units: string): string {
    if (forecasts.length === 0) return '';

    const temps = forecasts.map(f => f.main.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;

    const humidities = forecasts.map(f => f.main.humidity);
    const avgHumidity = humidities.reduce((a, b) => a + b, 0) / humidities.length;

    const precipitationProbs = forecasts.map(f => f.pop);
    const maxPrecipProb = Math.max(...precipitationProbs);

    const windSpeeds = forecasts.map(f => f.wind.speed);
    const maxWindSpeed = Math.max(...windSpeeds);

    let analysis = '📈 **趋势分析**\n';
    analysis += '─'.repeat(30) + '\n';
    analysis += `🌡️ **温度范围**: ${this.weatherService.formatTemperature(minTemp, units as any)} ~ ${this.weatherService.formatTemperature(maxTemp, units as any)}\n`;
    analysis += `📊 **平均温度**: ${this.weatherService.formatTemperature(avgTemp, units as any)}\n`;
    analysis += `💧 **平均湿度**: ${Math.round(avgHumidity)}%\n`;
    analysis += `🌧️ **最高降水概率**: ${Math.round(maxPrecipProb * 100)}%\n`;
    analysis += `🌬️ **最大风速**: ${this.weatherService.formatWindSpeed(maxWindSpeed, units as any)}\n`;

    // 天气趋势建议
    analysis += '\n💡 **建议**:\n';

    if (maxPrecipProb > 0.7) {
      analysis += '• 🌧️ 降水概率较高，建议携带雨具\n';
    }

    if (maxWindSpeed > 10) {
      analysis += '• 🌬️ 风力较大，注意防风\n';
    }

    if (maxTemp - minTemp > 15) {
      analysis += '• 🌡️ 温差较大，注意增减衣物\n';
    }

    if (avgHumidity > 80) {
      analysis += '• 💧 湿度较高，体感可能闷热\n';
    } else if (avgHumidity < 30) {
      analysis += '• 💧 湿度较低，注意补水保湿\n';
    }

    return analysis;
  }

  /**
   * 根据风向角度获取风向描述
   */
  private getWindDirection(deg: number): string {
    const directions = [
      '北', '北东北', '东北', '东东北',
      '东', '东东南', '东南', '南东南',
      '南', '南西南', '西南', '西西南',
      '西', '西西北', '西北', '北西北'
    ];

    const index = Math.round(deg / 22.5) % 16;
    return directions[index] || '未知';
  }

  /**
   * 获取工具描述
   */
  static getDescription(): string {
    return '获取指定位置的5天天气预报，每3小时一个数据点，包含温度、湿度、风速、降水概率等详细信息';
  }

  /**
   * 获取使用示例
   */
  static getExamples() {
    return [
      {
        description: '查询上海5天天气预报',
        input: {
          city: '上海',
          units: 'metric',
          lang: 'zh_cn',
        },
      },
      {
        description: '查询指定坐标的天气预报（限制8个数据点）',
        input: {
          lat: 31.2304,
          lon: 121.4737,
          cnt: 8,
          units: 'metric',
          lang: 'zh_cn',
        },
      },
      {
        description: '查询伦敦天气预报',
        input: {
          city: 'London,GB',
          units: 'metric',
          lang: 'en',
        },
      },
    ];
  }
}
