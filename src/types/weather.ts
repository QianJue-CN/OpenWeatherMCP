/**
 * OpenWeatherMap API 类型定义
 */

// 基础类型
export interface Coordinates {
  lat: number;
  lon: number;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface MainWeatherData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  sea_level?: number;
  grnd_level?: number;
}

export interface Wind {
  speed: number;
  deg: number;
  gust?: number;
}

export interface Clouds {
  all: number;
}

export interface Rain {
  "1h"?: number;
  "3h"?: number;
}

export interface Snow {
  "1h"?: number;
  "3h"?: number;
}

export interface Sys {
  type?: number;
  id?: number;
  country: string;
  sunrise: number;
  sunset: number;
}

// 当前天气响应
export interface CurrentWeatherResponse {
  coord: Coordinates;
  weather: WeatherCondition[];
  base: string;
  main: MainWeatherData;
  visibility: number;
  wind: Wind;
  clouds: Clouds;
  rain?: Rain;
  snow?: Snow;
  dt: number;
  sys: Sys;
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

// 天气预报数据项
export interface ForecastItem {
  dt: number;
  main: MainWeatherData;
  weather: WeatherCondition[];
  clouds: Clouds;
  wind: Wind;
  visibility: number;
  pop: number; // 降水概率
  rain?: Rain;
  snow?: Snow;
  sys: {
    pod: string; // 一天中的时间段 (d/n)
  };
  dt_txt: string;
}

// 城市信息
export interface City {
  id: number;
  name: string;
  coord: Coordinates;
  country: string;
  population: number;
  timezone: number;
  sunrise: number;
  sunset: number;
}

// 5天天气预报响应
export interface ForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: ForecastItem[];
  city: City;
}

// 空气质量组件
export interface AirQualityComponents {
  co: number;    // 一氧化碳 μg/m³
  no: number;    // 一氧化氮 μg/m³
  no2: number;   // 二氧化氮 μg/m³
  o3: number;    // 臭氧 μg/m³
  so2: number;   // 二氧化硫 μg/m³
  pm2_5: number; // PM2.5 μg/m³
  pm10: number;  // PM10 μg/m³
  nh3: number;   // 氨气 μg/m³
}

// 空气质量数据项
export interface AirQualityItem {
  dt: number;
  main: {
    aqi: number; // 空气质量指数 (1-5)
  };
  components: AirQualityComponents;
}

// 空气质量响应
export interface AirQualityResponse {
  coord: Coordinates;
  list: AirQualityItem[];
}

// 天气警报
export interface WeatherAlert {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

// One Call API 响应 (包含警报)
export interface OneCallResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current?: CurrentWeatherData;
  minutely?: MinutelyForecast[];
  hourly?: HourlyForecast[];
  daily?: DailyForecast[];
  alerts?: WeatherAlert[];
}

export interface CurrentWeatherData {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherCondition[];
  rain?: Rain;
  snow?: Snow;
}

export interface MinutelyForecast {
  dt: number;
  precipitation: number;
}

export interface HourlyForecast {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherCondition[];
  pop: number;
  rain?: Rain;
  snow?: Snow;
}

export interface DailyForecast {
  dt: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherCondition[];
  clouds: number;
  pop: number;
  rain?: number;
  snow?: number;
  uvi: number;
}

// 历史天气响应
export interface HistoricalWeatherResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  data: HistoricalWeatherData[];
}

export interface HistoricalWeatherData {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  weather: WeatherCondition[];
  rain?: Rain;
  snow?: Snow;
}

// 地理编码响应
export interface GeocodingResponse {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

// 工具参数类型
export interface LocationQuery {
  city?: string;
  lat?: number;
  lon?: number;
  zip?: string;
  country?: string;
}

export interface ForecastQuery extends LocationQuery {
  cnt?: number; // 预报时间点数量
}

export interface HistoricalQuery extends LocationQuery {
  dt: number; // Unix 时间戳
}

export interface AirQualityQuery extends LocationQuery {
  start?: number; // 开始时间 (历史数据)
  end?: number;   // 结束时间 (历史数据)
}

// 单位系统
export type Units = 'standard' | 'metric' | 'imperial';

// 语言代码
export type Language = 'zh_cn' | 'en' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'ru';

// API 配置
export interface WeatherApiConfig {
  apiKey: string;
  baseUrl?: string;
  units?: Units;
  lang?: Language;
}

// 错误响应
export interface WeatherApiError {
  cod: number;
  message: string;
}
