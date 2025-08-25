/**
 * 天气地图工具
 */

import type { OpenWeatherMapService } from '../services/openweather.js';
import type { WeatherMapInput, McpToolResponse } from '../types/mcp.js';

export class WeatherMapTool {
  constructor(private weatherService: OpenWeatherMapService) { }

  /**
   * 执行天气地图查询
   */
  async execute(input: WeatherMapInput): Promise<McpToolResponse> {
    try {
      const mapUrl = this.weatherService.getWeatherMapTileUrl(
        input.layer,
        input.z,
        input.x,
        input.y
      );

      const formattedResponse = this.formatWeatherMapResponse(input, mapUrl);

      return {
        content: [
          {
            type: 'text',
            text: formattedResponse,
          },
          {
            type: 'image',
            data: mapUrl,
            mimeType: 'image/png',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取天气地图时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 获取指定区域的天气地图信息
   */
  async getRegionMap(
    layer: string,
    centerLat: number,
    centerLon: number,
    zoom: number = 5
  ): Promise<McpToolResponse> {
    try {
      // 计算中心点对应的瓦片坐标
      const tileCoords = this.latLonToTile(centerLat, centerLon, zoom);

      const mapUrl = this.weatherService.getWeatherMapTileUrl(
        layer,
        zoom,
        tileCoords.x,
        tileCoords.y
      );

      const regionInfo = this.formatRegionMapResponse(
        layer,
        centerLat,
        centerLon,
        zoom,
        tileCoords,
        mapUrl
      );

      return {
        content: [
          {
            type: 'text',
            text: regionInfo,
          },
          {
            type: 'image',
            data: mapUrl,
            mimeType: 'image/png',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取区域天气地图时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 获取多图层天气地图对比
   */
  async getMultiLayerMaps(
    layers: string[],
    centerLat: number,
    centerLon: number,
    zoom: number = 5
  ): Promise<McpToolResponse> {
    try {
      const tileCoords = this.latLonToTile(centerLat, centerLon, zoom);
      const mapUrls: Array<{ layer: string; url: string; description: string }> = [];

      for (const layer of layers) {
        const url = this.weatherService.getWeatherMapTileUrl(
          layer,
          zoom,
          tileCoords.x,
          tileCoords.y
        );
        mapUrls.push({
          layer,
          url,
          description: this.getLayerDescription(layer),
        });
      }

      const comparisonInfo = this.formatMultiLayerResponse(
        centerLat,
        centerLon,
        zoom,
        mapUrls
      );

      const content: Array<{
        [x: string]: unknown;
        type: 'text';
        text: string;
        _meta?: { [x: string]: unknown } | undefined;
      } | {
        [x: string]: unknown;
        type: 'image';
        data: string;
        mimeType: string;
        _meta?: { [x: string]: unknown } | undefined;
      }> = [
          {
            type: 'text',
            text: comparisonInfo,
          },
        ];

      // 添加所有地图图像
      for (const mapInfo of mapUrls) {
        content.push({
          type: 'image',
          data: mapInfo.url,
          mimeType: 'image/png',
        });
      }

      return { content };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取多图层天气地图时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 格式化天气地图响应
   */
  private formatWeatherMapResponse(input: WeatherMapInput, mapUrl: string): string {
    const layerDescription = this.getLayerDescription(input.layer);
    const bounds = this.getTileBounds(input.x, input.y, input.z);

    let result = `🗺️ **天气地图瓦片**\n\n`;
    result += `📊 **图层类型**: ${layerDescription}\n`;
    result += `🔍 **缩放级别**: ${input.z}\n`;
    result += `📍 **瓦片坐标**: X=${input.x}, Y=${input.y}\n`;
    result += `🌍 **地理范围**:\n`;
    result += `  • 北纬: ${bounds.north.toFixed(4)}°\n`;
    result += `  • 南纬: ${bounds.south.toFixed(4)}°\n`;
    result += `  • 东经: ${bounds.east.toFixed(4)}°\n`;
    result += `  • 西经: ${bounds.west.toFixed(4)}°\n`;
    result += `🔗 **地图URL**: ${mapUrl}\n\n`;

    result += this.getLayerUsageGuide(input.layer);

    return result;
  }

  /**
   * 格式化区域地图响应
   */
  private formatRegionMapResponse(
    layer: string,
    lat: number,
    lon: number,
    zoom: number,
    tileCoords: { x: number; y: number },
    mapUrl: string
  ): string {
    const layerDescription = this.getLayerDescription(layer);

    let result = `🗺️ **区域天气地图**\n\n`;
    result += `📊 **图层类型**: ${layerDescription}\n`;
    result += `📍 **中心坐标**: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°\n`;
    result += `🔍 **缩放级别**: ${zoom}\n`;
    result += `🎯 **瓦片坐标**: X=${tileCoords.x}, Y=${tileCoords.y}\n`;
    result += `🔗 **地图URL**: ${mapUrl}\n\n`;

    result += this.getLayerInterpretation(layer);

    return result;
  }

  /**
   * 格式化多图层对比响应
   */
  private formatMultiLayerResponse(
    lat: number,
    lon: number,
    zoom: number,
    mapUrls: Array<{ layer: string; url: string; description: string }>
  ): string {
    let result = `🗺️ **多图层天气地图对比**\n\n`;
    result += `📍 **中心坐标**: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°\n`;
    result += `🔍 **缩放级别**: ${zoom}\n`;
    result += `📊 **图层数量**: ${mapUrls.length}\n\n`;

    result += `📋 **包含图层**:\n`;
    for (let i = 0; i < mapUrls.length; i++) {
      const mapInfo = mapUrls[i];
      if (mapInfo) {
        result += `${i + 1}. **${mapInfo.description}** (${mapInfo.layer})\n`;
      }
    }

    result += `\n💡 **使用说明**:\n`;
    result += `• 每个图层显示不同的天气要素\n`;
    result += `• 可以通过对比分析天气系统的综合特征\n`;
    result += `• 建议结合多个图层进行天气分析\n`;

    return result;
  }

  /**
   * 将经纬度转换为瓦片坐标
   */
  private latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lon + 180) / 360) * n);
    const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);

    return { x, y };
  }

  /**
   * 获取瓦片的地理边界
   */
  private getTileBounds(x: number, y: number, z: number): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    const n = Math.pow(2, z);
    const west = (x / n) * 360 - 180;
    const east = ((x + 1) / n) * 360 - 180;

    const northRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
    const southRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n)));

    const north = (northRad * 180) / Math.PI;
    const south = (southRad * 180) / Math.PI;

    return { north, south, east, west };
  }

  /**
   * 获取图层描述
   */
  private getLayerDescription(layer: string): string {
    const descriptions: Record<string, string> = {
      'clouds_new': '云层覆盖',
      'precipitation_new': '降水分布',
      'pressure_new': '气压分布',
      'wind_new': '风速风向',
      'temp_new': '温度分布',
    };

    return descriptions[layer] || layer;
  }

  /**
   * 获取图层使用指南
   */
  private getLayerUsageGuide(layer: string): string {
    const guides: Record<string, string> = {
      'clouds_new': `☁️ **云层图层说明**:
• 白色区域表示云层覆盖
• 颜色深浅表示云层厚度
• 可用于预测降水可能性`,

      'precipitation_new': `🌧️ **降水图层说明**:
• 蓝色区域表示降雨
• 白色区域表示降雪
• 颜色深浅表示降水强度`,

      'pressure_new': `📏 **气压图层说明**:
• 等压线显示气压分布
• 高压区通常天气晴朗
• 低压区容易产生恶劣天气`,

      'wind_new': `🌬️ **风速图层说明**:
• 箭头表示风向
• 颜色表示风速强度
• 可用于分析天气系统移动`,

      'temp_new': `🌡️ **温度图层说明**:
• 颜色表示温度高低
• 红色表示高温，蓝色表示低温
• 可用于分析温度梯度`,
    };

    return guides[layer] || '请参考OpenWeatherMap官方文档了解图层含义';
  }

  /**
   * 获取图层解读说明
   */
  private getLayerInterpretation(layer: string): string {
    const interpretations: Record<string, string> = {
      'clouds_new': `☁️ **云层分析**:
• 密集云层可能预示降水
• 云层移动方向反映风向
• 云层厚度影响日照强度`,

      'precipitation_new': `🌧️ **降水分析**:
• 当前降水分布情况
• 降水强度和类型
• 降水系统移动趋势`,

      'pressure_new': `📏 **气压分析**:
• 气压梯度影响风力
• 气压变化预示天气变化
• 气压系统决定天气模式`,

      'wind_new': `🌬️ **风场分析**:
• 风向风速分布
• 气流辐合辐散区域
• 风切变和湍流区域`,

      'temp_new': `🌡️ **温度分析**:
• 温度空间分布
• 温度梯度和锋面
• 热岛效应和冷空气`,
    };

    return interpretations[layer] || '';
  }

  /**
   * 获取工具描述
   */
  static getDescription(): string {
    return '获取OpenWeatherMap天气地图瓦片，支持云层、降水、气压、风速、温度等多种图层类型';
  }

  /**
   * 获取使用示例
   */
  static getExamples() {
    return [
      {
        description: '获取云层地图瓦片',
        input: {
          layer: 'clouds_new',
          z: 5,
          x: 16,
          y: 10,
        },
      },
      {
        description: '获取降水分布地图',
        input: {
          layer: 'precipitation_new',
          z: 6,
          x: 32,
          y: 21,
        },
      },
      {
        description: '获取温度分布地图',
        input: {
          layer: 'temp_new',
          z: 4,
          x: 8,
          y: 5,
        },
      },
    ];
  }
}
