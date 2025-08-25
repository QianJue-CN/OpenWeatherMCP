/**
 * OpenWeatherMap API 服务类
 */

import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type {
  WeatherApiConfig,
  CurrentWeatherResponse,
  ForecastResponse,
  AirQualityResponse,
  OneCallResponse,
  HistoricalWeatherResponse,
  GeocodingResponse,
  WeatherApiError,
  LocationQuery,
  ForecastQuery,
  HistoricalQuery,
  AirQualityQuery,
  Units,
  Language,
} from '../types/weather.js';

export class OpenWeatherMapService {
  private client: AxiosInstance;
  private apiKey: string;
  private defaultUnits: Units;
  private defaultLang: Language;

  constructor(config: WeatherApiConfig) {
    this.apiKey = config.apiKey;
    this.defaultUnits = config.units || 'metric';
    this.defaultLang = config.lang || 'zh_cn';

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.openweathermap.org/data/2.5',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器 - 添加 API 密钥
    this.client.interceptors.request.use((config) => {
      config.params = {
        ...config.params,
        appid: this.apiKey,
      };
      return config;
    });

    // 响应拦截器 - 错误处理
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data) {
          const apiError: WeatherApiError = error.response.data;
          throw new Error(`OpenWeatherMap API Error (${apiError.cod}): ${apiError.message}`);
        }
        throw new Error(`Network Error: ${error.message}`);
      }
    );
  }

  /**
   * 构建位置查询参数
   */
  private buildLocationParams(query: LocationQuery): Record<string, any> {
    if (query.city) {
      return { q: query.city };
    }
    if (query.lat !== undefined && query.lon !== undefined) {
      return { lat: query.lat, lon: query.lon };
    }
    if (query.zip) {
      return { zip: query.zip };
    }
    throw new Error('必须提供城市名称、坐标或邮政编码');
  }

  /**
   * 获取当前天气数据
   */
  async getCurrentWeather(
    query: LocationQuery,
    units: Units = this.defaultUnits,
    lang: Language = this.defaultLang
  ): Promise<CurrentWeatherResponse> {
    const params = {
      ...this.buildLocationParams(query),
      units,
      lang,
    };

    const response: AxiosResponse<CurrentWeatherResponse> = await this.client.get('/weather', {
      params,
    });

    return response.data;
  }

  /**
   * 获取5天天气预报
   */
  async getForecast(
    query: ForecastQuery,
    units: Units = this.defaultUnits,
    lang: Language = this.defaultLang
  ): Promise<ForecastResponse> {
    const params = {
      ...this.buildLocationParams(query),
      units,
      lang,
      ...(query.cnt && { cnt: query.cnt }),
    };

    const response: AxiosResponse<ForecastResponse> = await this.client.get('/forecast', {
      params,
    });

    return response.data;
  }

  /**
   * 获取空气质量数据
   */
  async getAirQuality(query: AirQualityQuery): Promise<AirQualityResponse> {
    const params = {
      lat: query.lat,
      lon: query.lon,
    };

    const response: AxiosResponse<AirQualityResponse> = await this.client.get('/air_pollution', {
      params,
    });

    return response.data;
  }

  /**
   * 获取历史空气质量数据
   */
  async getHistoricalAirQuality(query: AirQualityQuery): Promise<AirQualityResponse> {
    if (!query.start || !query.end) {
      throw new Error('历史空气质量数据需要提供开始和结束时间');
    }

    const params = {
      lat: query.lat,
      lon: query.lon,
      start: query.start,
      end: query.end,
    };

    const response: AxiosResponse<AirQualityResponse> = await this.client.get('/air_pollution/history', {
      params,
    });

    return response.data;
  }

  /**
   * 获取空气质量预报
   */
  async getAirQualityForecast(query: Pick<AirQualityQuery, 'lat' | 'lon'>): Promise<AirQualityResponse> {
    const params = {
      lat: query.lat,
      lon: query.lon,
    };

    const response: AxiosResponse<AirQualityResponse> = await this.client.get('/air_pollution/forecast', {
      params,
    });

    return response.data;
  }

  /**
   * 获取 One Call API 数据 (包含天气警报)
   */
  async getOneCallData(
    lat: number,
    lon: number,
    exclude?: string[],
    units: Units = this.defaultUnits,
    lang: Language = this.defaultLang
  ): Promise<OneCallResponse> {
    const params = {
      lat,
      lon,
      units,
      lang,
      ...(exclude && { exclude: exclude.join(',') }),
    };

    // One Call API 3.0 使用不同的基础 URL
    const response: AxiosResponse<OneCallResponse> = await axios.get(
      'https://api.openweathermap.org/data/3.0/onecall',
      {
        params: {
          ...params,
          appid: this.apiKey,
        },
        timeout: 10000,
      }
    );

    return response.data;
  }

  /**
   * 获取历史天气数据
   */
  async getHistoricalWeather(
    query: HistoricalQuery,
    units: Units = this.defaultUnits,
    lang: Language = this.defaultLang
  ): Promise<HistoricalWeatherResponse> {
    const params = {
      lat: query.lat,
      lon: query.lon,
      dt: query.dt,
      units,
      lang,
    };

    // 历史天气数据使用 One Call API
    const response: AxiosResponse<HistoricalWeatherResponse> = await axios.get(
      'https://api.openweathermap.org/data/3.0/onecall/timemachine',
      {
        params: {
          ...params,
          appid: this.apiKey,
        },
        timeout: 10000,
      }
    );

    return response.data;
  }

  /**
   * 地理编码 - 根据地名获取坐标
   */
  async geocoding(query: string, limit: number = 5): Promise<GeocodingResponse[]> {
    const params = {
      q: query,
      limit,
    };

    const response: AxiosResponse<GeocodingResponse[]> = await axios.get(
      'https://api.openweathermap.org/geo/1.0/direct',
      {
        params: {
          ...params,
          appid: this.apiKey,
        },
        timeout: 10000,
      }
    );

    return response.data;
  }

  /**
   * 反向地理编码 - 根据坐标获取地名
   */
  async reverseGeocoding(lat: number, lon: number, limit: number = 5): Promise<GeocodingResponse[]> {
    const params = {
      lat,
      lon,
      limit,
    };

    const response: AxiosResponse<GeocodingResponse[]> = await axios.get(
      'https://api.openweathermap.org/geo/1.0/reverse',
      {
        params: {
          ...params,
          appid: this.apiKey,
        },
        timeout: 10000,
      }
    );

    return response.data;
  }

  /**
   * 获取天气地图瓦片 URL
   */
  getWeatherMapTileUrl(layer: string, z: number, x: number, y: number): string {
    return `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${this.apiKey}`;
  }

  /**
   * 验证 API 密钥
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getCurrentWeather({ city: 'London' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 格式化温度显示
   */
  formatTemperature(temp: number, units: Units): string {
    switch (units) {
      case 'metric':
        return `${Math.round(temp)}°C`;
      case 'imperial':
        return `${Math.round(temp)}°F`;
      case 'standard':
        return `${Math.round(temp)}K`;
      default:
        return `${Math.round(temp)}°C`;
    }
  }

  /**
   * 格式化风速显示
   */
  formatWindSpeed(speed: number, units: Units): string {
    switch (units) {
      case 'metric':
        return `${speed} m/s`;
      case 'imperial':
        return `${speed} mph`;
      case 'standard':
        return `${speed} m/s`;
      default:
        return `${speed} m/s`;
    }
  }

  /**
   * 将 Unix 时间戳转换为可读时间
   */
  formatDateTime(timestamp: number, timezone?: number): string {
    const date = new Date(timestamp * 1000);
    if (timezone) {
      // 应用时区偏移
      date.setSeconds(date.getSeconds() + timezone);
    }
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
