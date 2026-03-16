import { Logger } from './logger.service';

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  duration: number; // 持续时间（秒）
  severity: 'low' | 'medium' | 'high' | 'critical';
  notificationChannels: ('email' | 'sms' | 'webhook')[];
  enabled: boolean;
}

interface MetricPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

interface Alert {
  id: string;
  ruleId: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'triggered' | 'resolved';
}

interface DashboardData {
  metric: string;
  points: MetricPoint[];
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

class MonitoringService {
  private metrics: Map<string, MetricPoint[]> = new Map();
  private alertRules: AlertRule[] = [];
  private activeAlerts: Alert[] = [];
  private readonly logger: Logger;
  private readonly dashboardData: Map<string, DashboardData> = new Map();

  constructor() {
    this.logger = new Logger('MonitoringService');
    this.initializeDefaultAlertRules();
    this.startMonitoringLoop();
  }

  /**
   * 记录指标
   */
  recordMetric(metricName: string, value: number, labels?: Record<string, string>): void {
    const now = new Date();
    const metricPoint: MetricPoint = { timestamp: now, value, labels };

    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }

    const metricPoints = this.metrics.get(metricName)!;
    metricPoints.push(metricPoint);

    // 保持最近1小时的数据
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const filteredPoints = metricPoints.filter(point => point.timestamp >= oneHourAgo);
    this.metrics.set(metricName, filteredPoints);

    // 更新仪表板数据
    this.updateDashboardData(metricName, metricPoint);

    this.logger.debug(`Recorded metric: ${metricName} = ${value}`, { labels });

    // 检查是否触发告警
    this.checkAlerts(metricName, value);
  }

  /**
   * 获取指标数据
   */
  getMetricData(
    metricName: string, 
    startTime?: Date, 
    endTime?: Date,
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count' = 'avg'
  ): MetricPoint[] {
    const allPoints = this.metrics.get(metricName) || [];
    
    let filteredPoints = allPoints;
    if (startTime) {
      filteredPoints = filteredPoints.filter(p => p.timestamp >= startTime);
    }
    if (endTime) {
      filteredPoints = filteredPoints.filter(p => p.timestamp <= endTime);
    }

    return filteredPoints;
  }

  /**
   * 获取聚合指标
   */
  getAggregatedMetric(
    metricName: string,
    windowMinutes: number = 5,
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count' = 'avg'
  ): number | null {
    const now = new Date();
    const startTime = new Date(now.getTime() - windowMinutes * 60 * 1000);
    
    const points = this.getMetricData(metricName, startTime);
    
    if (points.length === 0) {
      return null;
    }

    const values = points.map(p => p.value);
    
    switch (aggregation) {
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
  }

  /**
   * 创建告警规则
   */
  createAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const ruleId = this.generateId();
    const newRule: AlertRule = {
      ...rule,
      id: ruleId
    };

    this.alertRules.push(newRule);
    this.logger.info(`Created alert rule: ${newRule.name}`, { id: ruleId });

    return ruleId;
  }

  /**
   * 更新告警规则
   */
  updateAlertRule(ruleId: string, updates: Partial<Omit<AlertRule, 'id'>>): boolean {
    const index = this.alertRules.findIndex(r => r.id === ruleId);
    if (index === -1) return false;

    this.alertRules[index] = { ...this.alertRules[index], ...updates };
    this.logger.info(`Updated alert rule: ${ruleId}`);

    return true;
  }

  /**
   * 删除告警规则
   */
  deleteAlertRule(ruleId: string): boolean {
    const initialLength = this.alertRules.length;
    this.alertRules = this.alertRules.filter(r => r.id !== ruleId);
    
    if (initialLength !== this.alertRules.length) {
      this.logger.info(`Deleted alert rule: ${ruleId}`);
      // 关闭相关的活动告警
      this.activeAlerts = this.activeAlerts.filter(alert => alert.ruleId !== ruleId);
      return true;
    }

    return false;
  }

  /**
   * 获取所有告警规则
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * 获取活动告警
   */
  getActiveAlerts(): Alert[] {
    return this.activeAlerts.filter(alert => alert.status === 'triggered');
  }

  /**
   * 获取告警历史
   */
  getAlertHistory(): Alert[] {
    return [...this.activeAlerts];
  }

  /**
   * 获取仪表板数据
   */
  getDashboardData(metricName: string): DashboardData | undefined {
    return this.dashboardData.get(metricName);
  }

  /**
   * 检查是否触发告警
   */
  private checkAlerts(metricName: string, value: number): void {
    const applicableRules = this.alertRules.filter(
      rule => rule.metric === metricName && rule.enabled
    );

    for (const rule of applicableRules) {
      if (this.evaluateCondition(value, rule.condition, rule.threshold)) {
        // 检查是否已存在相同告警
        const existingAlert = this.activeAlerts.find(
          alert => alert.ruleId === rule.id && alert.status === 'triggered'
        );

        if (!existingAlert) {
          // 创建新告警
          const alert: Alert = {
            id: this.generateId(),
            ruleId: rule.id,
            metric: metricName,
            currentValue: value,
            threshold: rule.threshold,
            severity: rule.severity,
            triggeredAt: new Date(),
            status: 'triggered'
          };

          this.activeAlerts.push(alert);
          this.logger.warn(`Alert triggered: ${rule.name}`, {
            metric: metricName,
            value,
            threshold: rule.threshold,
            severity: rule.severity
          });

          // 发送通知
          this.sendAlertNotifications(alert, rule);
        }
      } else {
        // 检查是否需要解决告警
        const existingAlert = this.activeAlerts.find(
          alert => alert.ruleId === rule.id && alert.status === 'triggered'
        );

        if (existingAlert) {
          existingAlert.resolvedAt = new Date();
          existingAlert.status = 'resolved';
          this.logger.info(`Alert resolved: ${rule.id}`, {
            metric: metricName,
            value,
            threshold: rule.threshold
          });
        }
      }
    }
  }

  /**
   * 评估告警条件
   */
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * 发送告警通知
   */
  private async sendAlertNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    for (const channel of rule.notificationChannels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(alert, rule);
            break;
          case 'sms':
            await this.sendSmsAlert(alert, rule);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alert, rule);
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to send alert via ${channel}`, error);
      }
    }
  }

  /**
   * 发送邮件告警
   */
  private async sendEmailAlert(alert: Alert, rule: AlertRule): Promise<void> {
    // 模拟邮件发送
    console.log(`Sending email alert: ${rule.name} - ${alert.metric} = ${alert.currentValue}`);
    this.logger.info(`Email alert sent for rule: ${rule.name}`);
  }

  /**
   * 发送短信告警
   */
  private async sendSmsAlert(alert: Alert, rule: AlertRule): Promise<void> {
    // 模拟短信发送
    console.log(`Sending SMS alert: ${rule.name} - ${alert.metric} = ${alert.currentValue}`);
    this.logger.info(`SMS alert sent for rule: ${rule.name}`);
  }

  /**
   * 发送 Webhook 告警
   */
  private async sendWebhookAlert(alert: Alert, rule: AlertRule): Promise<void> {
    // 模拟 Webhook 调用
    console.log(`Sending webhook alert: ${rule.name} - ${alert.metric} = ${alert.currentValue}`);
    this.logger.info(`Webhook alert sent for rule: ${rule.name}`);
  }

  /**
   * 初始化默认告警规则
   */
  private initializeDefaultAlertRules(): void {
    // CPU 使用率过高
    this.createAlertRule({
      name: 'High CPU Usage',
      metric: 'cpu.usage',
      condition: 'greater_than',
      threshold: 80,
      duration: 60,
      severity: 'high',
      notificationChannels: ['email', 'sms'],
      enabled: true
    });

    // 内存使用率过高
    this.createAlertRule({
      name: 'High Memory Usage',
      metric: 'memory.usage',
      condition: 'greater_than',
      threshold: 85,
      duration: 60,
      severity: 'high',
      notificationChannels: ['email'],
      enabled: true
    });

    // 响应时间过长
    this.createAlertRule({
      name: 'Slow Response Time',
      metric: 'http.response.time',
      condition: 'greater_than',
      threshold: 2000,
      duration: 30,
      severity: 'medium',
      notificationChannels: ['email'],
      enabled: true
    });

    // 错误率过高
    this.createAlertRule({
      name: 'High Error Rate',
      metric: 'http.error.rate',
      condition: 'greater_than',
      threshold: 5,
      duration: 60,
      severity: 'high',
      notificationChannels: ['email', 'sms'],
      enabled: true
    });
  }

  /**
   * 更新仪表板数据
   */
  private updateDashboardData(metricName: string, point: MetricPoint): void {
    if (!this.dashboardData.has(metricName)) {
      this.dashboardData.set(metricName, {
        metric: metricName,
        points: [],
        aggregation: 'avg'
      });
    }

    const dashboardData = this.dashboardData.get(metricName)!;
    dashboardData.points.push(point);

    // 保持最近24小时的数据
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredPoints = dashboardData.points.filter(p => p.timestamp >= twentyFourHoursAgo);
    dashboardData.points = filteredPoints;
  }

  /**
   * 监控循环
   */
  private startMonitoringLoop(): void {
    // 定期清理旧数据
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }

  /**
   * 清理旧指标数据
   */
  private cleanupOldMetrics(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [metricName, points] of this.metrics.entries()) {
      const filteredPoints = points.filter(point => point.timestamp >= oneHourAgo);
      this.metrics.set(metricName, filteredPoints);
    }

    // 清理仪表板数据
    for (const [metricName, data] of this.dashboardData.entries()) {
      const filteredPoints = data.points.filter(point => point.timestamp >= oneHourAgo);
      data.points = filteredPoints;
    }

    this.logger.debug('Cleaned up old metric data');
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取系统健康状况
   */
  getSystemHealth(): {
    uptime: number;
    metricsCount: number;
    activeAlerts: number;
    totalAlerts: number;
  } {
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24小时前
    
    return {
      uptime: 100, // 简化的健康分数
      metricsCount: Array.from(this.metrics.values()).reduce((sum, points) => sum + points.length, 0),
      activeAlerts: this.activeAlerts.filter(a => a.status === 'triggered').length,
      totalAlerts: this.activeAlerts.length
    };
  }
}

// 单例模式
let monitoringService: MonitoringService;

export function getMonitoringService(): MonitoringService {
  if (!monitoringService) {
    monitoringService = new MonitoringService();
  }
  return monitoringService;
}

export { MonitoringService, AlertRule, Alert, MetricPoint };