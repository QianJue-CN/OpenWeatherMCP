/**
 * MCP 工具相关类型定义
 */

import { z } from 'zod';

// 工具输入验证 Schema
export const LocationQuerySchema = z.object({
  city: z.string().optional().describe('城市名称，例如: "北京" 或 "Beijing,CN"'),
  lat: z.number().min(-90).max(90).optional().describe('纬度 (-90 到 90)'),
  lon: z.number().min(-180).max(180).optional().describe('经度 (-180 到 180)'),
  zip: z.string().optional().describe('邮政编码，例如: "10001,US"'),
  country: z.string().length(2).optional().describe('国家代码 (ISO 3166)'),
}).refine(
  (data) => data.city || (data.lat !== undefined && data.lon !== undefined) || data.zip,
  {
    message: "必须提供城市名称、坐标(纬度和经度)或邮政编码中的一种",
  }
);

export const UnitsSchema = z.enum(['standard', 'metric', 'imperial']).default('metric').describe(
  '单位系统: standard(开尔文), metric(摄氏度), imperial(华氏度)'
);

export const LanguageSchema = z.enum(['zh_cn', 'en', 'es', 'fr', 'de', 'ja', 'ko', 'ru']).default('zh_cn').describe(
  '语言代码'
);

// 当前天气查询参数
export const CurrentWeatherSchema = z.object({
  city: z.string().optional().describe('城市名称，例如: "北京" 或 "Beijing,CN"'),
  lat: z.number().min(-90).max(90).optional().describe('纬度 (-90 到 90)'),
  lon: z.number().min(-180).max(180).optional().describe('经度 (-180 到 180)'),
  zip: z.string().optional().describe('邮政编码，例如: "10001,US"'),
  country: z.string().length(2).optional().describe('国家代码 (ISO 3166)'),
  units: UnitsSchema,
  lang: LanguageSchema,
}).refine(
  (data) => data.city || (data.lat !== undefined && data.lon !== undefined) || data.zip,
  {
    message: "必须提供城市名称、坐标(纬度和经度)或邮政编码中的一种",
  }
);

// 天气预报查询参数
export const ForecastSchema = z.object({
  city: z.string().optional().describe('城市名称，例如: "北京" 或 "Beijing,CN"'),
  lat: z.number().min(-90).max(90).optional().describe('纬度 (-90 到 90)'),
  lon: z.number().min(-180).max(180).optional().describe('经度 (-180 到 180)'),
  zip: z.string().optional().describe('邮政编码，例如: "10001,US"'),
  country: z.string().length(2).optional().describe('国家代码 (ISO 3166)'),
  cnt: z.number().min(1).max(40).optional().describe('预报时间点数量 (最多40个，每3小时一个点)'),
  units: UnitsSchema,
  lang: LanguageSchema,
}).refine(
  (data) => data.city || (data.lat !== undefined && data.lon !== undefined) || data.zip,
  {
    message: "必须提供城市名称、坐标(纬度和经度)或邮政编码中的一种",
  }
);

// 空气质量查询参数
export const AirQualitySchema = z.object({
  lat: z.number().min(-90).max(90).describe('纬度 (-90 到 90)'),
  lon: z.number().min(-180).max(180).describe('经度 (-180 到 180)'),
  start: z.number().optional().describe('开始时间 Unix 时间戳 (仅历史数据)'),
  end: z.number().optional().describe('结束时间 Unix 时间戳 (仅历史数据)'),
});

// 历史天气查询参数
export const HistoricalWeatherSchema = z.object({
  lat: z.number().min(-90).max(90).describe('纬度 (-90 到 90)'),
  lon: z.number().min(-180).max(180).describe('经度 (-180 到 180)'),
  dt: z.number().describe('查询日期的 Unix 时间戳'),
  units: UnitsSchema,
  lang: LanguageSchema,
});

// 天气地图查询参数
export const WeatherMapSchema = z.object({
  layer: z.enum([
    'clouds_new',
    'precipitation_new',
    'pressure_new',
    'wind_new',
    'temp_new'
  ]).describe('地图图层类型'),
  z: z.number().min(0).max(10).describe('缩放级别 (0-10)'),
  x: z.number().min(0).describe('瓦片 X 坐标'),
  y: z.number().min(0).describe('瓦片 Y 坐标'),
});

// 天气警报查询参数
export const WeatherAlertsSchema = z.object({
  lat: z.number().min(-90).max(90).describe('纬度 (-90 到 90)'),
  lon: z.number().min(-180).max(180).describe('经度 (-180 到 180)'),
});

// 地理编码查询参数
export const GeocodingSchema = z.object({
  q: z.string().describe('位置查询字符串，例如: "London" 或 "London,GB"'),
  limit: z.number().min(1).max(5).default(5).describe('返回结果数量限制 (1-5)'),
});

// 反向地理编码查询参数
export const ReverseGeocodingSchema = z.object({
  lat: z.number().min(-90).max(90).describe('纬度 (-90 到 90)'),
  lon: z.number().min(-180).max(180).describe('经度 (-180 到 180)'),
  limit: z.number().min(1).max(5).default(5).describe('返回结果数量限制 (1-5)'),
});

// 工具输入类型推断
export type CurrentWeatherInput = z.infer<typeof CurrentWeatherSchema>;
export type ForecastInput = z.infer<typeof ForecastSchema>;
export type AirQualityInput = z.infer<typeof AirQualitySchema>;
export type HistoricalWeatherInput = z.infer<typeof HistoricalWeatherSchema>;
export type WeatherMapInput = z.infer<typeof WeatherMapSchema>;
export type WeatherAlertsInput = z.infer<typeof WeatherAlertsSchema>;
export type GeocodingInput = z.infer<typeof GeocodingSchema>;
export type ReverseGeocodingInput = z.infer<typeof ReverseGeocodingSchema>;

// MCP 工具响应类型 - 简化版本
export interface McpToolResponse {
  [x: string]: unknown;
  content: Array<any>;
  isError?: boolean;
  _meta?: { [x: string]: unknown } | undefined;
}

// 错误处理类型
export interface WeatherError {
  code: string;
  message: string;
  details?: any;
}

// 工具元数据
export interface ToolMetadata {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  examples?: Array<{
    description: string;
    input: any;
  }>;
}
