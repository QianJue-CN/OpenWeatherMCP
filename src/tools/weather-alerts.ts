/**
 * 天气警报工具
 */

import type { OpenWeatherMapService } from '../services/openweather.js';
import type { WeatherAlertsInput, McpToolResponse } from '../types/mcp.js';
import type { OneCallResponse, WeatherAlert } from '../types/weather.js';

export class WeatherAlertsTool {
  constructor(private weatherService: OpenWeatherMapService) { }

  /**
   * 执行天气警报查询
   */
  async execute(input: WeatherAlertsInput): Promise<McpToolResponse> {
    try {
      // 使用 One Call API 获取天气警报
      const oneCallData = await this.weatherService.getOneCallData(
        input.lat,
        input.lon,
        ['minutely', 'hourly', 'daily'], // 只获取警报数据，排除其他数据
        'metric',
        'zh_cn'
      );

      const formattedResponse = this.formatWeatherAlertsResponse(oneCallData, input);

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
            text: `获取天气警报时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 格式化天气警报响应
   */
  private formatWeatherAlertsResponse(data: OneCallResponse, input: WeatherAlertsInput): string {
    let result = `⚠️ **天气警报查询**\n\n`;
    result += `📍 **查询坐标**: ${input.lat.toFixed(4)}°, ${input.lon.toFixed(4)}°\n`;
    result += `🌍 **时区**: ${data.timezone}\n`;
    result += `⏰ **查询时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;

    if (!data.alerts || data.alerts.length === 0) {
      result += `✅ **当前状态**: 该地区暂无天气警报\n\n`;
      result += `💡 **说明**:\n`;
      result += `• 当前该地区天气状况良好\n`;
      result += `• 未发布任何天气预警信息\n`;
      result += `• 建议定期检查天气变化\n`;
      result += `• 如有疑问请关注当地气象部门发布的信息\n`;

      return result;
    }

    result += `🚨 **警报总数**: ${data.alerts.length} 条\n\n`;

    // 按严重程度排序警报
    const sortedAlerts = this.sortAlertsBySeverity(data.alerts);

    for (let i = 0; i < sortedAlerts.length; i++) {
      const alert = sortedAlerts[i];
      if (alert) {
        result += this.formatSingleAlert(alert, i + 1);
        result += '\n';
      }
    }

    // 添加总体建议
    result += this.generateOverallGuidance(sortedAlerts);

    return result;
  }

  /**
   * 格式化单个警报
   */
  private formatSingleAlert(alert: WeatherAlert, index: number): string {
    const startTime = new Date(alert.start * 1000).toLocaleString('zh-CN');
    const endTime = new Date(alert.end * 1000).toLocaleString('zh-CN');
    const duration = this.calculateDuration(alert.start, alert.end);
    const severity = this.getAlertSeverity(alert);
    const urgency = this.getAlertUrgency(alert);

    let result = `${severity.icon} **警报 ${index}: ${alert.event}**\n`;
    result += `📢 **发布机构**: ${alert.sender_name}\n`;
    result += `⚡ **严重程度**: ${severity.level}\n`;
    result += `🚨 **紧急程度**: ${urgency}\n`;
    result += `⏰ **生效时间**: ${startTime}\n`;
    result += `⏳ **结束时间**: ${endTime}\n`;
    result += `📅 **持续时间**: ${duration}\n`;

    // 标签信息
    if (alert.tags && alert.tags.length > 0) {
      result += `🏷️ **标签**: ${alert.tags.join(', ')}\n`;
    }

    // 详细描述
    result += `\n📝 **详细描述**:\n`;
    result += this.formatAlertDescription(alert.description);

    // 安全建议
    result += `\n🛡️ **安全建议**:\n`;
    result += this.generateSafetyAdvice(alert);

    return result;
  }

  /**
   * 格式化警报描述
   */
  private formatAlertDescription(description: string): string {
    // 将长描述分段显示，提高可读性
    const sentences = description.split(/[.。!！?？]/);
    let formatted = '';

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 0) {
        formatted += `• ${trimmed}\n`;
      }
    }

    return formatted || description;
  }

  /**
   * 获取警报严重程度
   */
  private getAlertSeverity(alert: WeatherAlert): { level: string; icon: string } {
    const event = alert.event.toLowerCase();
    const description = alert.description.toLowerCase();

    // 根据事件类型和描述判断严重程度
    if (event.includes('extreme') || description.includes('极端') || description.includes('严重')) {
      return { level: '极端', icon: '🔴' };
    } else if (event.includes('severe') || description.includes('重大') || description.includes('危险')) {
      return { level: '严重', icon: '🟠' };
    } else if (event.includes('moderate') || description.includes('中等') || description.includes('注意')) {
      return { level: '中等', icon: '🟡' };
    } else {
      return { level: '轻微', icon: '🟢' };
    }
  }

  /**
   * 获取警报紧急程度
   */
  private getAlertUrgency(alert: WeatherAlert): string {
    const now = Date.now() / 1000;
    const timeToStart = alert.start - now;

    if (timeToStart <= 0) {
      return '立即生效';
    } else if (timeToStart <= 3600) { // 1小时内
      return '1小时内生效';
    } else if (timeToStart <= 21600) { // 6小时内
      return '6小时内生效';
    } else if (timeToStart <= 86400) { // 24小时内
      return '24小时内生效';
    } else {
      return '超过24小时后生效';
    }
  }

  /**
   * 计算持续时间
   */
  private calculateDuration(start: number, end: number): string {
    const durationSeconds = end - start;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}天${remainingHours > 0 ? remainingHours + '小时' : ''}`;
    } else if (hours > 0) {
      return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
    } else {
      return `${minutes}分钟`;
    }
  }

  /**
   * 按严重程度排序警报
   */
  private sortAlertsBySeverity(alerts: WeatherAlert[]): WeatherAlert[] {
    return alerts.sort((a, b) => {
      const severityA = this.getAlertSeverity(a);
      const severityB = this.getAlertSeverity(b);

      const severityOrder = { '极端': 4, '严重': 3, '中等': 2, '轻微': 1 };
      const orderA = severityOrder[severityA.level as keyof typeof severityOrder] || 0;
      const orderB = severityOrder[severityB.level as keyof typeof severityOrder] || 0;

      return orderB - orderA; // 降序排列，严重的在前
    });
  }

  /**
   * 生成安全建议
   */
  private generateSafetyAdvice(alert: WeatherAlert): string {
    const event = alert.event.toLowerCase();
    const description = alert.description.toLowerCase();

    let advice = '';

    // 根据不同类型的天气事件提供相应建议
    if (event.includes('storm') || event.includes('thunder') || description.includes('雷暴')) {
      advice += '• 避免户外活动，远离高大建筑物和树木\n';
      advice += '• 关闭电器设备，避免使用固定电话\n';
      advice += '• 如在室外，寻找坚固建筑物避险\n';
    }

    if (event.includes('wind') || description.includes('大风') || description.includes('风暴')) {
      advice += '• 加固门窗，收起户外物品\n';
      advice += '• 避免在高楼、广告牌附近行走\n';
      advice += '• 驾车时注意横风影响\n';
    }

    if (event.includes('rain') || event.includes('flood') || description.includes('暴雨') || description.includes('洪水')) {
      advice += '• 避免前往低洼地区和地下空间\n';
      advice += '• 不要涉水行走或驾驶\n';
      advice += '• 准备应急物品和饮用水\n';
    }

    if (event.includes('snow') || event.includes('ice') || description.includes('暴雪') || description.includes('冰雹')) {
      advice += '• 减少外出，注意防寒保暖\n';
      advice += '• 驾车时减速慢行，携带防滑链\n';
      advice += '• 清理屋顶积雪，防止坍塌\n';
    }

    if (event.includes('heat') || description.includes('高温') || description.includes('热浪')) {
      advice += '• 避免长时间户外活动\n';
      advice += '• 多饮水，避免中暑\n';
      advice += '• 关注老人和儿童的健康状况\n';
    }

    if (event.includes('cold') || description.includes('寒潮') || description.includes('低温')) {
      advice += '• 注意防寒保暖，预防冻伤\n';
      advice += '• 检查供暖设备，防止一氧化碳中毒\n';
      advice += '• 保护水管防冻\n';
    }

    // 通用建议
    if (advice === '') {
      advice += '• 密切关注天气变化和官方通知\n';
      advice += '• 做好应急准备，确保通讯畅通\n';
      advice += '• 遵循当地政府和气象部门的指导\n';
    }

    return advice;
  }

  /**
   * 生成总体指导建议
   */
  private generateOverallGuidance(alerts: WeatherAlert[]): string {
    if (alerts.length === 0) return '';

    const hasExtreme = alerts.some(alert => this.getAlertSeverity(alert).level === '极端');
    const hasSevere = alerts.some(alert => this.getAlertSeverity(alert).level === '严重');

    let guidance = '🎯 **总体建议**:\n';

    if (hasExtreme) {
      guidance += '• ⚠️ 存在极端天气警报，请立即采取防护措施\n';
      guidance += '• 🚫 强烈建议取消非必要的外出计划\n';
      guidance += '• 📞 保持与家人朋友的联系\n';
    } else if (hasSevere) {
      guidance += '• ⚠️ 存在严重天气警报，请提高警惕\n';
      guidance += '• 🏠 尽量待在安全的室内环境\n';
      guidance += '• 📱 关注最新天气预警信息\n';
    } else {
      guidance += '• ℹ️ 请关注天气变化，做好相应准备\n';
      guidance += '• 📋 检查应急物品是否齐全\n';
    }

    guidance += '• 🆘 如遇紧急情况，立即拨打当地应急电话\n';
    guidance += '• 📺 持续关注官方媒体发布的最新信息\n';

    return guidance;
  }

  /**
   * 获取工具描述
   */
  static getDescription(): string {
    return '获取指定坐标的天气警报信息，包括政府发布的各类天气预警和安全建议';
  }

  /**
   * 获取使用示例
   */
  static getExamples() {
    return [
      {
        description: '查询北京地区天气警报',
        input: {
          lat: 39.9042,
          lon: 116.4074,
        },
      },
      {
        description: '查询上海地区天气警报',
        input: {
          lat: 31.2304,
          lon: 121.4737,
        },
      },
      {
        description: '查询纽约地区天气警报',
        input: {
          lat: 40.7128,
          lon: -74.0060,
        },
      },
    ];
  }
}
