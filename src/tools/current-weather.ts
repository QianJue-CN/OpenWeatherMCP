/**
 * 当前天气查询工具
 */

import type { OpenWeatherMapService } from '../services/openweather.js';
import type { CurrentWeatherInput, McpToolResponse } from '../types/mcp.js';
import type { CurrentWeatherResponse } from '../types/weather.js';

export class CurrentWeatherTool {
  constructor(private weatherService: OpenWeatherMapService) { }

  /**
   * 执行当前天气查询
   */
  async execute(input: CurrentWeatherInput): Promise<McpToolResponse> {
    try {
      const locationQuery: any = {};

      // 处理参数
      if (input.city) {
        locationQuery.city = input.city;
      }
      if (input.lat !== undefined && input.lon !== undefined) {
        locationQuery.lat = input.lat;
        locationQuery.lon = input.lon;
      }
      if (input.zip) {
        locationQuery.zip = input.zip;
      }
      if (input.country) {
        locationQuery.country = input.country;
      }

      const weatherData = await this.weatherService.getCurrentWeather(
        locationQuery,
        input['units'] || 'metric',
        input['lang'] || 'zh_cn'
      );

      const formattedResponse = this.formatWeatherResponse(weatherData, input['units']);

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
            text: `获取当前天气数据时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 格式化天气响应数据
   */
  private formatWeatherResponse(data: CurrentWeatherResponse, units: string): string {
    const location = `${data.name}, ${data.sys.country}`;
    const temperature = this.weatherService.formatTemperature(data.main.temp, units as any);
    const feelsLike = this.weatherService.formatTemperature(data.main.feels_like, units as any);
    const tempMin = this.weatherService.formatTemperature(data.main.temp_min, units as any);
    const tempMax = this.weatherService.formatTemperature(data.main.temp_max, units as any);

    const windSpeed = this.weatherService.formatWindSpeed(data.wind.speed, units as any);
    const windDirection = this.getWindDirection(data.wind.deg);

    const sunrise = this.weatherService.formatDateTime(data.sys.sunrise, data.timezone);
    const sunset = this.weatherService.formatDateTime(data.sys.sunset, data.timezone);
    const updateTime = this.weatherService.formatDateTime(data.dt, data.timezone);

    let result = `🌍 **${location}** 当前天气\n\n`;

    // 主要天气信息
    result += `🌡️ **温度**: ${temperature} (体感 ${feelsLike})\n`;
    result += `📊 **温度范围**: ${tempMin} ~ ${tempMax}\n`;
    result += `☁️ **天气**: ${data.weather[0]?.description || '未知'}\n`;
    result += `💧 **湿度**: ${data.main.humidity}%\n`;
    result += `🌬️ **风速**: ${windSpeed} ${windDirection}\n`;
    result += `📏 **气压**: ${data.main.pressure} hPa\n`;

    // 可见度
    if (data.visibility) {
      result += `👁️ **能见度**: ${(data.visibility / 1000).toFixed(1)} km\n`;
    }

    // 云量
    result += `☁️ **云量**: ${data.clouds.all}%\n`;

    // 降水信息
    if (data.rain) {
      if (data.rain['1h']) {
        result += `🌧️ **降雨量 (1小时)**: ${data.rain['1h']} mm\n`;
      }
      if (data.rain['3h']) {
        result += `🌧️ **降雨量 (3小时)**: ${data.rain['3h']} mm\n`;
      }
    }

    if (data.snow) {
      if (data.snow['1h']) {
        result += `❄️ **降雪量 (1小时)**: ${data.snow['1h']} mm\n`;
      }
      if (data.snow['3h']) {
        result += `❄️ **降雪量 (3小时)**: ${data.snow['3h']} mm\n`;
      }
    }

    // 日出日落
    result += `\n🌅 **日出**: ${sunrise}\n`;
    result += `🌇 **日落**: ${sunset}\n`;

    // 坐标和更新时间
    result += `\n📍 **坐标**: ${data.coord.lat.toFixed(4)}, ${data.coord.lon.toFixed(4)}\n`;
    result += `🕐 **更新时间**: ${updateTime}\n`;

    // 天气图标说明
    result += `\n🎨 **天气图标**: ${data.weather[0]?.icon || 'N/A'} (${data.weather[0]?.main || '未知'})`;

    return result;
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
    return '获取指定位置的当前天气信息，包括温度、湿度、风速、气压、能见度等详细数据';
  }

  /**
   * 获取使用示例
   */
  static getExamples() {
    return [
      {
        description: '查询北京当前天气',
        input: {
          city: '北京',
          units: 'metric',
          lang: 'zh_cn',
        },
      },
      {
        description: '通过坐标查询天气',
        input: {
          lat: 39.9042,
          lon: 116.4074,
          units: 'metric',
          lang: 'zh_cn',
        },
      },
      {
        description: '查询纽约天气（华氏度）',
        input: {
          city: 'New York,US',
          units: 'imperial',
          lang: 'en',
        },
      },
    ];
  }
}
