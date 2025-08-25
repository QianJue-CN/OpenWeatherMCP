/**
 * 空气质量工具
 */

import type { OpenWeatherMapService } from '../services/openweather.js';
import type { AirQualityInput, McpToolResponse } from '../types/mcp.js';
import type { AirQualityResponse, AirQualityItem, AirQualityComponents } from '../types/weather.js';

export class AirPollutionTool {
  constructor(private weatherService: OpenWeatherMapService) { }

  /**
   * 执行空气质量查询
   */
  async execute(input: AirQualityInput): Promise<McpToolResponse> {
    try {
      let airQualityData: AirQualityResponse;

      // 根据是否提供时间范围决定调用哪个API
      if (input.start && input.end) {
        // 历史空气质量数据
        airQualityData = await this.weatherService.getHistoricalAirQuality({
          lat: input.lat,
          lon: input.lon,
          start: input.start,
          end: input.end,
        });
      } else {
        // 当前空气质量数据
        airQualityData = await this.weatherService.getAirQuality({
          lat: input.lat,
          lon: input.lon,
        });
      }

      const formattedResponse = this.formatAirQualityResponse(airQualityData, input);

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
            text: `获取空气质量数据时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 获取空气质量预报
   */
  async getForecast(lat: number, lon: number): Promise<McpToolResponse> {
    try {
      const forecastData = await this.weatherService.getAirQualityForecast({ lat, lon });
      const formattedResponse = this.formatAirQualityForecast(forecastData);

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
            text: `获取空气质量预报时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 格式化空气质量响应数据
   */
  private formatAirQualityResponse(data: AirQualityResponse, input: AirQualityInput): string {
    let result = `🌍 **空气质量报告**\n`;
    result += `📍 **坐标**: ${data.coord.lat.toFixed(4)}, ${data.coord.lon.toFixed(4)}\n\n`;

    if (input.start && input.end) {
      const startDate = new Date(input.start * 1000).toLocaleDateString('zh-CN');
      const endDate = new Date(input.end * 1000).toLocaleDateString('zh-CN');
      result += `📅 **时间范围**: ${startDate} - ${endDate}\n`;
      result += `📊 **数据点数**: ${data.list.length} 个\n\n`;
    } else {
      result += `📅 **查询类型**: 当前空气质量\n\n`;
    }

    // 如果是历史数据，显示统计信息
    if (data.list.length > 1) {
      result += this.formatAirQualityStatistics(data.list);
    } else if (data.list.length === 1 && data.list[0]) {
      result += this.formatSingleAirQualityData(data.list[0]);
    }

    result += '\n' + this.getAirQualityGuidance(data.list);

    return result;
  }

  /**
   * 格式化空气质量预报
   */
  private formatAirQualityForecast(data: AirQualityResponse): string {
    let result = `🌍 **空气质量预报**\n`;
    result += `📍 **坐标**: ${data.coord.lat.toFixed(4)}, ${data.coord.lon.toFixed(4)}\n`;
    result += `📊 **预报数据点**: ${data.list.length} 个\n\n`;

    for (let i = 0; i < Math.min(data.list.length, 5); i++) {
      const item = data.list[i];
      if (item) {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });

        result += `📅 **${dateStr}**\n`;
        result += this.formatSingleAirQualityData(item);
        result += '\n';
      }
    }

    return result;
  }

  /**
   * 格式化单个空气质量数据
   */
  private formatSingleAirQualityData(item: AirQualityItem): string {
    const aqi = item.main.aqi;
    const aqiLevel = this.getAQILevel(aqi);
    const aqiColor = this.getAQIColor(aqi);

    let result = `${aqiColor} **空气质量指数**: ${aqi} (${aqiLevel})\n\n`;

    result += '🧪 **污染物浓度** (μg/m³):\n';
    result += `• CO (一氧化碳): ${item.components.co.toFixed(2)}\n`;
    result += `• NO (一氧化氮): ${item.components.no.toFixed(2)}\n`;
    result += `• NO₂ (二氧化氮): ${item.components.no2.toFixed(2)}\n`;
    result += `• O₃ (臭氧): ${item.components.o3.toFixed(2)}\n`;
    result += `• SO₂ (二氧化硫): ${item.components.so2.toFixed(2)}\n`;
    result += `• PM2.5: ${item.components.pm2_5.toFixed(2)}\n`;
    result += `• PM10: ${item.components.pm10.toFixed(2)}\n`;
    result += `• NH₃ (氨气): ${item.components.nh3.toFixed(2)}\n`;

    // 添加主要污染物分析
    const mainPollutant = this.getMainPollutant(item.components);
    result += `\n🎯 **主要污染物**: ${mainPollutant}\n`;

    return result;
  }

  /**
   * 格式化空气质量统计信息
   */
  private formatAirQualityStatistics(items: AirQualityItem[]): string {
    const aqis = items.map(item => item.main.aqi);
    const avgAqi = aqis.reduce((a, b) => a + b, 0) / aqis.length;
    const minAqi = Math.min(...aqis);
    const maxAqi = Math.max(...aqis);

    // 计算各污染物的平均值
    const avgComponents = this.calculateAverageComponents(items);

    let result = `📊 **统计概览**\n`;
    result += `• 平均AQI: ${avgAqi.toFixed(1)} (${this.getAQILevel(Math.round(avgAqi))})\n`;
    result += `• AQI范围: ${minAqi} - ${maxAqi}\n`;
    result += `• 数据点数: ${items.length}\n\n`;

    result += `📈 **平均污染物浓度** (μg/m³):\n`;
    result += `• PM2.5: ${avgComponents.pm2_5.toFixed(2)}\n`;
    result += `• PM10: ${avgComponents.pm10.toFixed(2)}\n`;
    result += `• O₃: ${avgComponents.o3.toFixed(2)}\n`;
    result += `• NO₂: ${avgComponents.no2.toFixed(2)}\n`;
    result += `• SO₂: ${avgComponents.so2.toFixed(2)}\n`;
    result += `• CO: ${avgComponents.co.toFixed(2)}\n\n`;

    // 趋势分析
    result += this.analyzeTrend(items);

    return result;
  }

  /**
   * 计算平均污染物浓度
   */
  private calculateAverageComponents(items: AirQualityItem[]): AirQualityComponents {
    const sum = items.reduce((acc, item) => {
      return {
        co: acc.co + item.components.co,
        no: acc.no + item.components.no,
        no2: acc.no2 + item.components.no2,
        o3: acc.o3 + item.components.o3,
        so2: acc.so2 + item.components.so2,
        pm2_5: acc.pm2_5 + item.components.pm2_5,
        pm10: acc.pm10 + item.components.pm10,
        nh3: acc.nh3 + item.components.nh3,
      };
    }, { co: 0, no: 0, no2: 0, o3: 0, so2: 0, pm2_5: 0, pm10: 0, nh3: 0 });

    const count = items.length;
    return {
      co: sum.co / count,
      no: sum.no / count,
      no2: sum.no2 / count,
      o3: sum.o3 / count,
      so2: sum.so2 / count,
      pm2_5: sum.pm2_5 / count,
      pm10: sum.pm10 / count,
      nh3: sum.nh3 / count,
    };
  }

  /**
   * 分析空气质量趋势
   */
  private analyzeTrend(items: AirQualityItem[]): string {
    if (items.length < 2) return '';

    const firstItem = items[0];
    const lastItem = items[items.length - 1];
    if (!firstItem || !lastItem) return '';

    const firstAqi = firstItem.main.aqi;
    const lastAqi = lastItem.main.aqi;
    const trend = lastAqi - firstAqi;

    let result = `📈 **趋势分析**:\n`;

    if (trend > 0) {
      result += `• 空气质量呈恶化趋势 (AQI上升 ${trend})\n`;
    } else if (trend < 0) {
      result += `• 空气质量呈改善趋势 (AQI下降 ${Math.abs(trend)})\n`;
    } else {
      result += `• 空气质量保持稳定\n`;
    }

    return result;
  }

  /**
   * 获取AQI等级描述
   */
  private getAQILevel(aqi: number): string {
    switch (aqi) {
      case 1: return '优秀';
      case 2: return '良好';
      case 3: return '中等';
      case 4: return '较差';
      case 5: return '很差';
      default: return '未知';
    }
  }

  /**
   * 获取AQI颜色表情
   */
  private getAQIColor(aqi: number): string {
    switch (aqi) {
      case 1: return '🟢';
      case 2: return '🟡';
      case 3: return '🟠';
      case 4: return '🔴';
      case 5: return '🟣';
      default: return '⚪';
    }
  }

  /**
   * 获取主要污染物
   */
  private getMainPollutant(components: AirQualityComponents): string {
    const pollutants = [
      { name: 'PM2.5', value: components.pm2_5, threshold: 25 },
      { name: 'PM10', value: components.pm10, threshold: 50 },
      { name: 'O₃', value: components.o3, threshold: 100 },
      { name: 'NO₂', value: components.no2, threshold: 40 },
      { name: 'SO₂', value: components.so2, threshold: 20 },
      { name: 'CO', value: components.co, threshold: 10000 },
    ];

    const exceedingPollutants = pollutants.filter(p => p.value > p.threshold);

    if (exceedingPollutants.length === 0) {
      return '无明显污染物超标';
    }

    const maxPollutant = exceedingPollutants.reduce((max, current) =>
      (current.value / current.threshold) > (max.value / max.threshold) ? current : max
    );

    return `${maxPollutant.name} (${maxPollutant.value.toFixed(2)} μg/m³)`;
  }

  /**
   * 获取空气质量指导建议
   */
  private getAirQualityGuidance(items: AirQualityItem[]): string {
    if (items.length === 0) return '';

    const avgAqi = items.reduce((sum, item) => sum + item.main.aqi, 0) / items.length;
    const roundedAqi = Math.round(avgAqi);

    let guidance = '💡 **健康建议**:\n';

    switch (roundedAqi) {
      case 1:
        guidance += '• 空气质量优秀，适合所有户外活动\n';
        guidance += '• 可以开窗通风，享受新鲜空气\n';
        break;
      case 2:
        guidance += '• 空气质量良好，适合户外活动\n';
        guidance += '• 敏感人群可能会有轻微不适\n';
        break;
      case 3:
        guidance += '• 空气质量中等，敏感人群应减少户外活动\n';
        guidance += '• 建议关闭门窗，使用空气净化器\n';
        break;
      case 4:
        guidance += '• 空气质量较差，所有人群应减少户外活动\n';
        guidance += '• 外出时建议佩戴口罩\n';
        guidance += '• 避免剧烈运动\n';
        break;
      case 5:
        guidance += '• 空气质量很差，避免户外活动\n';
        guidance += '• 必须外出时佩戴专业防护口罩\n';
        guidance += '• 关闭门窗，使用空气净化器\n';
        guidance += '• 敏感人群应留在室内\n';
        break;
    }

    return guidance;
  }

  /**
   * 获取工具描述
   */
  static getDescription(): string {
    return '获取指定坐标的空气质量数据，包括AQI指数和各种污染物浓度，支持当前、历史和预报数据';
  }

  /**
   * 获取使用示例
   */
  static getExamples() {
    return [
      {
        description: '查询北京当前空气质量',
        input: {
          lat: 39.9042,
          lon: 116.4074,
        },
      },
      {
        description: '查询历史空气质量数据',
        input: {
          lat: 39.9042,
          lon: 116.4074,
          start: 1606780800, // 2020-12-01
          end: 1606867200,   // 2020-12-02
        },
      },
    ];
  }
}
