/**
 * MetricCard - 指标卡片组件
 * 
 * 用于展示关键业务指标，支持货币、百分比等格式化
 * 
 * @component
 * @example
 * ```tsx
 * <MetricCard
 *   title="今日放款金额"
 *   value={500000}
 *   format="currency"
 *   currency="THB"
 *   trend={{
 *     value: 15.5,
 *     direction: "up",
 *     label: "较昨日"
 *   }}
 *   icon="cash"
 *   color="success"
 * />
 * ```
 */

import React from "react";
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonText,
  IonBadge
} from "@ionic/react";
import {
  trendUpOutline,
  trendDownOutline,
  cashOutline,
  peopleOutline,
  documentTextOutline,
  timeOutline
} from "ionicons/icons";

// ============================================================================
// 类型定义
// ============================================================================

export interface MetricCardProps {
  /** 指标标题 */
  title: string;
  /** 指标值 */
  value: string | number;
  /** 数据绑定路径（可选，用于动态数据） */
  valuePath?: string;
  /** 格式化方式 */
  format?: "currency" | "percent" | "number" | "date";
  /** 货币单位 */
  currency?: string;
  /** 趋势信息 */
  trend?: {
    value: number;
    direction: "up" | "down";
    label?: string;
  };
  /** 图标名称 */
  icon?: string;
  /** 颜色主题 */
  color?: "primary" | "secondary" | "success" | "warning" | "danger" | "light" | "dark";
  /** 操作按钮 */
  action?: {
    label: string;
    actionId: string;
  };
  /** 点击回调 */
  onClick?: () => void;
  /** 额外类名 */
  className?: string;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 格式化数值
 */
export const formatValue = (
  value: string | number,
  format: "currency" | "percent" | "number" | "date" = "number",
  currency: string = "THB"
): string => {
  if (typeof value === "string") {
    return value;
  }

  switch (format) {
    case "currency":
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
      
    case "percent":
      return new Intl.NumberFormat("th-TH", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 2
      }).format(value / 100);
      
    case "date":
      return new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }).format(new Date(value));
      
    case "number":
    default:
      return new Intl.NumberFormat("th-TH").format(value);
  }
};

/**
 * 获取图标
 */
export const getIcon = (iconName?: string): string => {
  const iconMap: Record<string, string> = {
    cash: cashOutline,
    money: cashOutline,
    users: peopleOutline,
    people: peopleOutline,
    document: documentTextOutline,
    file: documentTextOutline,
    time: timeOutline,
    clock: timeOutline
  };
  
  return iconName ? (iconMap[iconName] || iconName) : cashOutline;
};

// ============================================================================
// 组件实现
// ============================================================================

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  valuePath,
  format = "number",
  currency = "THB",
  trend,
  icon,
  color = "primary",
  action,
  onClick,
  className
}) => {
  const formattedValue = formatValue(value, format, currency);
  const displayIcon = getIcon(icon);
  
  // 趋势颜色
  const getTrendColor = () => {
    if (!trend) return undefined;
    return trend.direction === "up" ? "success" : "danger";
  };

  // 趋势图标
  const TrendIcon = trend?.direction === "up" ? trendUpOutline : trendDownOutline;

  return (
    <IonCard
      className={`metric-card ${className || ""}`}
      style={{
        margin: "0",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        cursor: onClick ? "pointer" : "default"
      }}
      onClick={onClick}
    >
      <IonCardHeader style={{ paddingBottom: "8px" }}>
        <IonCardTitle
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "var(--ion-color-medium)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {icon && (
            <IonIcon
              icon={displayIcon}
              color={color}
              style={{ fontSize: "18px" }}
            />
          )}
          {title}
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent style={{ paddingTop: "0" }}>
        {/* 指标值 */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "var(--ion-color-dark)",
            marginBottom: "8px"
          }}
        >
          {formattedValue}
        </div>
        
        {/* 趋势 */}
        {trend && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px"
            }}
          >
            <IonIcon
              icon={TrendIcon}
              color={getTrendColor()}
              style={{ fontSize: "16px" }}
            />
            <IonText color={getTrendColor()}>
              <strong>
                {trend.direction === "up" ? "+" : "-"}
                {Math.abs(trend.value).toFixed(1)}%
              </strong>
            </IonText>
            {trend.label && (
              <IonText color="medium">
                {trend.label}
              </IonText>
            )}
          </div>
        )}
        
        {/* 操作按钮 */}
        {action && (
          <IonBadge
            color={color}
            style={{
              marginTop: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            {action.label}
          </IonBadge>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default MetricCard;
