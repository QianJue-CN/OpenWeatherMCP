/**
 * 历史天气工具
 */

import type { OpenWeatherMapService } from '../services/openweather.js';
import type { HistoricalWeatherInput, McpToolResponse } from '../types/mcp.js';
import type { HistoricalWeatherResponse, HistoricalWeatherData } from '../types/weather.js';

export class HistoricalWeatherTool {
  constructor(private weatherService: OpenWeatherMapService) { }

  /**
   * 执行历史天气查询
   */
  async execute(input: HistoricalWeatherInput): Promise<McpToolResponse> {
    try {
      const historicalData = await this.weatherService.getHistoricalWeather(
        {
          lat: input.lat,
          lon: input.lon,
          dt: input.dt,
        },
        input.units,
        input.lang
      );

      const formattedResponse = this.formatHistoricalWeatherResponse(historicalData, input);

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
            text: `获取历史天气数据时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 获取多日历史天气对比
   */
  async getMultiDayComparison(
    lat: number,
    lon: number,
    timestamps: number[],
    units: string = 'metric',
    lang: string = 'zh_cn'
  ): Promise<McpToolResponse> {
    try {
      const historicalDataList: Array<{ date: string; data: HistoricalWeatherResponse }> = [];

      for (const timestamp of timestamps) {
        const data = await this.weatherService.getHistoricalWeather(
          { lat, lon, dt: timestamp },
          units as any,
          lang as any
        );

        const date = new Date(timestamp * 1000).toLocaleDateString('zh-CN');
        historicalDataList.push({ date, data });
      }

      const comparisonResponse = this.formatMultiDayComparison(historicalDataList, units);

      return {
        content: [
          {
            type: 'text',
            text: comparisonResponse,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取多日历史天气对比时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 格式化历史天气响应
   */
  private formatHistoricalWeatherResponse(
    data: HistoricalWeatherResponse,
    input: HistoricalWeatherInput
  ): string {
    const queryDate = new Date(input.dt * 1000);
    const dateStr = queryDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long',
    });

    let result = `📅 **历史天气查询**\n\n`;
    result += `📍 **坐标**: ${data.lat.toFixed(4)}°, ${data.lon.toFixed(4)}°\n`;
    result += `🗓️ **查询日期**: ${dateStr}\n`;
    result += `🌍 **时区**: ${data.timezone}\n`;
    result += `📊 **数据点数**: ${data.data.length} 个\n\n`;

    if (data.data.length === 0) {
      result += `❌ **无数据**: 该日期暂无历史天气数据\n`;
      result += `💡 **说明**: 历史天气数据可能不完整或该日期超出数据范围\n`;
      return result;
    }

    // 如果有多个数据点，显示统计信息
    if (data.data.length > 1) {
      result += this.formatDailyStatistics(data.data, input.units);
      result += '\n';
    }

    // 显示详细的小时数据（最多显示前12个小时）
    result += `⏰ **详细数据** (按小时):\n`;
    result += '─'.repeat(50) + '\n';

    const maxHours = Math.min(data.data.length, 12);
    for (let i = 0; i < maxHours; i++) {
      const hourData = data.data[i];
      if (hourData) {
        result += this.formatHourlyData(hourData, input.units, data.timezone_offset);
        result += '\n';
      }
    }

    if (data.data.length > 12) {
      result += `... 还有 ${data.data.length - 12} 个小时的数据\n\n`;
    }

    // 添加天气分析
    result += this.generateWeatherAnalysis(data.data, input.units);

    return result;
  }

  /**
   * 格式化多日对比
   */
  private formatMultiDayComparison(
    historicalDataList: Array<{ date: string; data: HistoricalWeatherResponse }>,
    units: string
  ): string {
    let result = `📊 **多日历史天气对比**\n\n`;
    result += `📍 **坐标**: ${historicalDataList[0]?.data.lat.toFixed(4)}°, ${historicalDataList[0]?.data.lon.toFixed(4)}°\n`;
    result += `📅 **对比日期数**: ${historicalDataList.length} 天\n\n`;

    // 为每一天生成摘要
    for (const { date, data } of historicalDataList) {
      if (data.data.length > 0) {
        const dayStats = this.calculateDayStatistics(data.data);
        result += `📅 **${date}**:\n`;
        result += `  🌡️ 温度: ${this.weatherService.formatTemperature(dayStats.avgTemp, units as any)} `;
        result += `(${this.weatherService.formatTemperature(dayStats.minTemp, units as any)} ~ `;
        result += `${this.weatherService.formatTemperature(dayStats.maxTemp, units as any)})\n`;
        result += `  💧 湿度: ${dayStats.avgHumidity.toFixed(0)}%\n`;
        result += `  🌬️ 风速: ${this.weatherService.formatWindSpeed(dayStats.avgWindSpeed, units as any)}\n`;
        result += `  📏 气压: ${dayStats.avgPressure.toFixed(0)} hPa\n`;

        if (dayStats.weather) {
          result += `  ☁️ 天气: ${dayStats.weather}\n`;
        }
        result += '\n';
      }
    }

    // 生成对比分析
    result += this.generateComparisonAnalysis(historicalDataList, units);

    return result;
  }

  /**
   * 格式化日统计信息
   */
  private formatDailyStatistics(data: HistoricalWeatherData[], units: string): string {
    const stats = this.calculateDayStatistics(data);

    let result = `📈 **当日统计**:\n`;
    result += `🌡️ **温度**: 平均 ${this.weatherService.formatTemperature(stats.avgTemp, units as any)}, `;
    result += `最低 ${this.weatherService.formatTemperature(stats.minTemp, units as any)}, `;
    result += `最高 ${this.weatherService.formatTemperature(stats.maxTemp, units as any)}\n`;
    result += `💧 **湿度**: 平均 ${stats.avgHumidity.toFixed(0)}% (${stats.minHumidity}% ~ ${stats.maxHumidity}%)\n`;
    result += `🌬️ **风速**: 平均 ${this.weatherService.formatWindSpeed(stats.avgWindSpeed, units as any)}, `;
    result += `最大 ${this.weatherService.formatWindSpeed(stats.maxWindSpeed, units as any)}\n`;
    result += `📏 **气压**: 平均 ${stats.avgPressure.toFixed(0)} hPa (${stats.minPressure.toFixed(0)} ~ ${stats.maxPressure.toFixed(0)})\n`;

    if (stats.weather) {
      result += `☁️ **主要天气**: ${stats.weather}\n`;
    }

    return result;
  }

  /**
   * 格式化小时数据
   */
  private formatHourlyData(data: HistoricalWeatherData, units: string, timezoneOffset: number): string {
    const time = this.weatherService.formatDateTime(data.dt, timezoneOffset);
    const temp = this.weatherService.formatTemperature(data.temp, units as any);
    const feelsLike = this.weatherService.formatTemperature(data.feels_like, units as any);
    const windSpeed = this.weatherService.formatWindSpeed(data.wind_speed, units as any);

    let result = `🕐 **${time.split(' ')[1]}** - ${data.weather[0]?.description || '未知'}\n`;
    result += `   🌡️ ${temp} (体感 ${feelsLike}) | 💧 ${data.humidity}% | 🌬️ ${windSpeed}`;

    if (data.wind_deg !== undefined) {
      const windDir = this.getWindDirection(data.wind_deg);
      result += ` ${windDir}`;
    }

    result += ` | 📏 ${data.pressure} hPa`;

    if (data.uvi !== undefined) {
      result += ` | ☀️ UV ${data.uvi.toFixed(1)}`;
    }

    // 降水信息
    if (data.rain) {
      result += ` | 🌧️ ${Object.values(data.rain)[0]} mm`;
    }
    if (data.snow) {
      result += ` | ❄️ ${Object.values(data.snow)[0]} mm`;
    }

    return result;
  }

  /**
   * 计算日统计数据
   */
  private calculateDayStatistics(data: HistoricalWeatherData[]) {
    if (data.length === 0) {
      throw new Error('无数据可供统计');
    }

    const temps = data.map(d => d.temp);
    const humidities = data.map(d => d.humidity);
    const windSpeeds = data.map(d => d.wind_speed);
    const pressures = data.map(d => d.pressure);

    // 获取最常见的天气描述
    const weatherDescriptions = data.map(d => d.weather[0]?.description).filter((desc): desc is string => Boolean(desc));
    const weatherCounts: Record<string, number> = {};
    weatherDescriptions.forEach(desc => {
      if (desc) {
        weatherCounts[desc] = (weatherCounts[desc] || 0) + 1;
      }
    });
    const mostCommonWeather = Object.entries(weatherCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    return {
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      minTemp: Math.min(...temps),
      maxTemp: Math.max(...temps),
      avgHumidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      minHumidity: Math.min(...humidities),
      maxHumidity: Math.max(...humidities),
      avgWindSpeed: windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length,
      maxWindSpeed: Math.max(...windSpeeds),
      avgPressure: pressures.reduce((a, b) => a + b, 0) / pressures.length,
      minPressure: Math.min(...pressures),
      maxPressure: Math.max(...pressures),
      weather: mostCommonWeather,
    };
  }

  /**
   * 生成天气分析
   */
  private generateWeatherAnalysis(data: HistoricalWeatherData[], units: string): string {
    const stats = this.calculateDayStatistics(data);

    let analysis = `🔍 **天气分析**:\n`;

    // 温度分析
    const tempRange = stats.maxTemp - stats.minTemp;
    if (tempRange > 15) {
      analysis += `• 🌡️ 温差较大 (${tempRange.toFixed(1)}°)，天气变化明显\n`;
    } else if (tempRange < 5) {
      analysis += `• 🌡️ 温差较小 (${tempRange.toFixed(1)}°)，温度相对稳定\n`;
    }

    // 湿度分析
    if (stats.avgHumidity > 80) {
      analysis += `• 💧 湿度较高 (${stats.avgHumidity.toFixed(0)}%)，体感可能闷热\n`;
    } else if (stats.avgHumidity < 30) {
      analysis += `• 💧 湿度较低 (${stats.avgHumidity.toFixed(0)}%)，空气干燥\n`;
    }

    // 风速分析
    if (stats.maxWindSpeed > 10) {
      analysis += `• 🌬️ 风力较大 (最大${this.weatherService.formatWindSpeed(stats.maxWindSpeed, units as any)})，注意防风\n`;
    }

    // 气压分析
    if (stats.avgPressure < 1000) {
      analysis += `• 📏 气压偏低 (${stats.avgPressure.toFixed(0)} hPa)，可能有降水\n`;
    } else if (stats.avgPressure > 1020) {
      analysis += `• 📏 气压偏高 (${stats.avgPressure.toFixed(0)} hPa)，天气晴朗\n`;
    }

    return analysis;
  }

  /**
   * 生成对比分析
   */
  private generateComparisonAnalysis(
    historicalDataList: Array<{ date: string; data: HistoricalWeatherResponse }>,
    units: string
  ): string {
    if (historicalDataList.length < 2) return '';

    const allStats = historicalDataList.map(({ date, data }) => ({
      date,
      stats: data.data.length > 0 ? this.calculateDayStatistics(data.data) : null,
    })).filter(item => item.stats !== null);

    if (allStats.length < 2) return '';

    let analysis = `📊 **对比分析**:\n`;

    // 温度对比
    const temps = allStats.map(item => item.stats!.avgTemp);
    const maxTempIndex = temps.indexOf(Math.max(...temps));
    const minTempIndex = temps.indexOf(Math.min(...temps));
    const maxTempDay = allStats[maxTempIndex];
    const minTempDay = allStats[minTempIndex];

    if (maxTempDay && minTempDay) {
      analysis += `• 🌡️ 最热: ${maxTempDay.date} (${this.weatherService.formatTemperature(maxTempDay.stats!.avgTemp, units as any)})\n`;
      analysis += `• 🌡️ 最冷: ${minTempDay.date} (${this.weatherService.formatTemperature(minTempDay.stats!.avgTemp, units as any)})\n`;
    }

    // 湿度对比
    const humidities = allStats.map(item => item.stats!.avgHumidity);
    const maxHumidityIndex = humidities.indexOf(Math.max(...humidities));
    const minHumidityIndex = humidities.indexOf(Math.min(...humidities));
    const maxHumidityDay = allStats[maxHumidityIndex];
    const minHumidityDay = allStats[minHumidityIndex];

    if (maxHumidityDay && minHumidityDay) {
      analysis += `• 💧 最湿润: ${maxHumidityDay.date} (${maxHumidityDay.stats!.avgHumidity.toFixed(0)}%)\n`;
      analysis += `• 💧 最干燥: ${minHumidityDay.date} (${minHumidityDay.stats!.avgHumidity.toFixed(0)}%)\n`;
    }

    return analysis;
  }

  /**
   * 获取风向描述
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
    return '获取指定坐标和日期的历史天气数据，支持单日查询和多日对比分析';
  }

  /**
   * 获取使用示例
   */
  static getExamples() {
    return [
      {
        description: '查询2023年1月1日北京的历史天气',
        input: {
          lat: 39.9042,
          lon: 116.4074,
          dt: 1672531200, // 2023-01-01 00:00:00 UTC
          units: 'metric',
          lang: 'zh_cn',
        },
      },
      {
        description: '查询2022年12月25日的历史天气',
        input: {
          lat: 31.2304,
          lon: 121.4737,
          dt: 1671926400, // 2022-12-25 00:00:00 UTC
          units: 'metric',
          lang: 'zh_cn',
        },
      },
    ];
  }
}
