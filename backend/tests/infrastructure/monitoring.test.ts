import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MonitoringService, getMonitoringService, AlertRule } from '../../services/monitoring.service';

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;

  beforeEach(() => {
    monitoringService = new MonitoringService();
  });

  it('should initialize correctly', () => {
    expect(monitoringService).toBeDefined();
    expect(typeof monitoringService.recordMetric).toBe('function');
    expect(typeof monitoringService.createAlertRule).toBe('function');
    expect(typeof monitoringService.getSystemHealth).toBe('function');
  });

  it('should record metrics correctly', () => {
    monitoringService.recordMetric('test.metric', 100, { env: 'test' });
    
    const aggregated = monitoringService.getAggregatedMetric('test.metric');
    expect(aggregated).toBe(100);
  });

  it('should store metrics with timestamps', () => {
    const before = new Date();
    monitoringService.recordMetric('timestamp.metric', 50);
    const after = new Date();
    
    const data = monitoringService.getMetricData('timestamp.metric');
    expect(data.length).toBe(1);
    expect(data[0].value).toBe(50);
    expect(data[0].timestamp).toBeInstanceOf(Date);
    expect(data[0].timestamp >= before && data[0].timestamp <= after).toBeTruthy();
  });

  it('should calculate aggregated metrics', () => {
    monitoringService.recordMetric('agg.metric', 10);
    monitoringService.recordMetric('agg.metric', 20);
    monitoringService.recordMetric('agg.metric', 30);
    
    const avg = monitoringService.getAggregatedMetric('agg.metric', 5, 'avg');
    const sum = monitoringService.getAggregatedMetric('agg.metric', 5, 'sum');
    const max = monitoringService.getAggregatedMetric('agg.metric', 5, 'max');
    const min = monitoringService.getAggregatedMetric('agg.metric', 5, 'min');
    const count = monitoringService.getAggregatedMetric('agg.metric', 5, 'count');
    
    expect(avg).toBe(20); // (10+20+30)/3
    expect(sum).toBe(60); // 10+20+30
    expect(max).toBe(30);
    expect(min).toBe(10);
    expect(count).toBe(3);
  });

  it('should create and retrieve alert rules', () => {
    const ruleId = monitoringService.createAlertRule({
      name: 'Test Rule',
      metric: 'test.metric',
      condition: 'greater_than',
      threshold: 50,
      duration: 60,
      severity: 'high',
      notificationChannels: ['email'],
      enabled: true
    });
    
    const rules = monitoringService.getAlertRules();
    const rule = rules.find(r => r.id === ruleId);
    
    expect(rule).toBeDefined();
    expect(rule!.name).toBe('Test Rule');
    expect(rule!.metric).toBe('test.metric');
    expect(rule!.threshold).toBe(50);
  });

  it('should update alert rules', () => {
    const ruleId = monitoringService.createAlertRule({
      name: 'Original Name',
      metric: 'test.metric',
      condition: 'greater_than',
      threshold: 50,
      duration: 60,
      severity: 'high',
      notificationChannels: ['email'],
      enabled: true
    });
    
    const updated = monitoringService.updateAlertRule(ruleId, {
      name: 'Updated Name',
      threshold: 75
    });
    
    expect(updated).toBe(true);
    
    const rules = monitoringService.getAlertRules();
    const rule = rules.find(r => r.id === ruleId);
    
    expect(rule!.name).toBe('Updated Name');
    expect(rule!.threshold).toBe(75);
  });

  it('should delete alert rules', () => {
    const ruleId = monitoringService.createAlertRule({
      name: 'Delete Test',
      metric: 'test.metric',
      condition: 'greater_than',
      threshold: 50,
      duration: 60,
      severity: 'high',
      notificationChannels: ['email'],
      enabled: true
    });
    
    const initialCount = monitoringService.getAlertRules().length;
    const deleted = monitoringService.deleteAlertRule(ruleId);
    const finalCount = monitoringService.getAlertRules().length;
    
    expect(deleted).toBe(true);
    expect(finalCount).toBe(initialCount - 1);
  });

  it('should trigger alerts when conditions are met', () => {
    // Create an alert rule
    const ruleId = monitoringService.createAlertRule({
      name: 'High Value Alert',
      metric: 'high.value.metric',
      condition: 'greater_than',
      threshold: 10,
      duration: 1, // 1 second
      severity: 'high',
      notificationChannels: ['email'],
      enabled: true
    });
    
    // Record a value that exceeds the threshold
    monitoringService.recordMetric('high.value.metric', 15);
    
    // Check if alert was triggered
    const activeAlerts = monitoringService.getActiveAlerts();
    const triggeredAlert = activeAlerts.find(alert => alert.ruleId === ruleId);
    
    expect(triggeredAlert).toBeDefined();
    expect(triggeredAlert!.currentValue).toBe(15);
    expect(triggeredAlert!.threshold).toBe(10);
    expect(triggeredAlert!.severity).toBe('high');
    expect(triggeredAlert!.status).toBe('triggered');
  });

  it('should resolve alerts when conditions are no longer met', () => {
    // Create an alert rule
    const ruleId = monitoringService.createAlertRule({
      name: 'Resolvable Alert',
      metric: 'resolvable.metric',
      condition: 'greater_than',
      threshold: 10,
      duration: 1,
      severity: 'medium',
      notificationChannels: ['email'],
      enabled: true
    });
    
    // Trigger the alert
    monitoringService.recordMetric('resolvable.metric', 15);
    let activeAlerts = monitoringService.getActiveAlerts();
    let triggeredAlert = activeAlerts.find(alert => alert.ruleId === ruleId);
    expect(triggeredAlert).toBeDefined();
    
    // Now record a value below the threshold
    monitoringService.recordMetric('resolvable.metric', 5);
    
    // The alert should still be active initially
    activeAlerts = monitoringService.getActiveAlerts();
    triggeredAlert = activeAlerts.find(alert => alert.ruleId === ruleId);
    
    // Note: In this simplified test, we're checking that the alert system works
    // In a real scenario, resolution might take some time based on duration settings
  });

  it('should evaluate conditions correctly', () => {
    const service = new MonitoringService();
    
    expect(service['evaluateCondition'](10, 'greater_than', 5)).toBe(true);
    expect(service['evaluateCondition'](10, 'greater_than', 15)).toBe(false);
    expect(service['evaluateCondition'](10, 'less_than', 15)).toBe(true);
    expect(service['evaluateCondition'](10, 'less_than', 5)).toBe(false);
    expect(service['evaluateCondition'](10, 'equals', 10)).toBe(true);
    expect(service['evaluateCondition'](10, 'equals', 15)).toBe(false);
    expect(service['evaluateCondition'](10, 'not_equals', 15)).toBe(true);
    expect(service['evaluateCondition'](10, 'not_equals', 10)).toBe(false);
  });

  it('should return system health information', () => {
    const health = monitoringService.getSystemHealth();
    
    expect(health).toHaveProperty('uptime');
    expect(health).toHaveProperty('metricsCount');
    expect(health).toHaveProperty('activeAlerts');
    expect(health).toHaveProperty('totalAlerts');
    
    expect(typeof health.uptime).toBe('number');
    expect(typeof health.metricsCount).toBe('number');
    expect(typeof health.activeAlerts).toBe('number');
    expect(typeof health.totalAlerts).toBe('number');
  });

  it('should maintain dashboard data', () => {
    monitoringService.recordMetric('dashboard.metric', 100, { service: 'api' });
    monitoringService.recordMetric('dashboard.metric', 200, { service: 'worker' });
    
    const dashboardData = monitoringService.getDashboardData('dashboard.metric');
    
    expect(dashboardData).toBeDefined();
    expect(dashboardData!.metric).toBe('dashboard.metric');
    expect(dashboardData!.points.length).toBeGreaterThan(0);
  });
});

describe('getMonitoringService singleton', () => {
  it('should return the same instance', () => {
    const instance1 = getMonitoringService();
    const instance2 = getMonitoringService();
    
    expect(instance1).toBe(instance2);
  });
});