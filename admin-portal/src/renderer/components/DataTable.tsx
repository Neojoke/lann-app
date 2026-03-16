/**
 * DataTable - 数据表格组件
 * 
 * 支持分页、排序、筛选和行操作
 * 
 * @component
 * @example
 * ```tsx
 * <DataTable
 *   tableId="loans"
 *   dataPath="/loans/recent"
 *   columns={[
 *     { key: "userId", label: "用户", type: "text" },
 *     { key: "amount", label: "金额", type: "currency" },
 *     { key: "status", label: "状态", type: "status" },
 *     { key: "createdAt", label: "时间", type: "date" }
 *   ]}
 *   pagination={{ enabled: true, pageSize: 20 }}
 *   rowActions={[
 *     { label: "查看详情", actionId: "view_loan_detail" }
 *   ]}
 * />
 * ```
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  IonTable,
  IonTr,
  IonTh,
  IonTd,
  IonThead,
  IonTbody,
  IonIcon,
  IonBadge,
  IonButton,
  IonButtons,
  IonPagination,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel
} from "@ionic/react";
import {
  arrowUpOutline,
  arrowDownOutline,
  ellipsisHorizontalOutline
} from "ionicons/icons";

// ============================================================================
// 类型定义
// ============================================================================

export interface ColumnDefinition {
  /** 列键 */
  key: string;
  /** 列标题 */
  label: string;
  /** 列类型 */
  type: "text" | "number" | "currency" | "date" | "status" | "action";
  /** 格式化方式 */
  format?: string;
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否可筛选 */
  filterable?: boolean;
  /** 列宽 */
  width?: string;
}

export interface RowAction {
  /** 操作标签 */
  label: string;
  /** 操作 ID */
  actionId: string;
  /** 图标 */
  icon?: string;
  /** 可见性条件 */
  visible?: string;
}

export interface PaginationConfig {
  /** 是否启用分页 */
  enabled?: boolean;
  /** 每页数量 */
  pageSize?: number;
  /** 每页数量选项 */
  pageSizeOptions?: number[];
}

export interface DataTableProps {
  /** 表格唯一标识 */
  tableId: string;
  /** 数据路径 */
  dataPath: string;
  /** 列定义 */
  columns: ColumnDefinition[];
  /** 分页配置 */
  pagination?: PaginationConfig;
  /** 行操作 */
  rowActions?: RowAction[];
  /** 数据（外部提供或内部加载） */
  data?: any[];
  /** 加载状态 */
  loading?: boolean;
  /** 空状态提示 */
  emptyMessage?: string;
  /** 行点击回调 */
  onRowClick?: (row: any) => void;
  /** 行操作回调 */
  onRowAction?: (actionId: string, row: any) => void;
  /** 排序变化回调 */
  onSortChange?: (key: string, direction: "asc" | "desc") => void;
  /** 额外类名 */
  className?: string;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 格式化单元格值
 */
export const formatCellValue = (
  value: any,
  type: ColumnDefinition["type"],
  format?: string
): string | React.ReactNode => {
  if (value === undefined || value === null) {
    return "-";
  }

  switch (type) {
    case "currency":
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: format || "THB",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value as number);
      
    case "date":
      return new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: format?.includes("time") ? "2-digit" : undefined,
        minute: format?.includes("time") ? "2-digit" : undefined
      }).format(new Date(value as string));
      
    case "status":
      const statusColors: Record<string, string> = {
        pending: "warning",
        approved: "success",
        rejected: "danger",
        active: "success",
        inactive: "medium",
        completed: "success",
        overdue: "danger"
      };
      const statusLabel: Record<string, string> = {
        pending: "待审核",
        approved: "已通过",
        rejected: "已拒绝",
        active: "活跃",
        inactive: "未激活",
        completed: "已完成",
        overdue: "逾期"
      };
      return (
        <IonBadge color={statusColors[value as string] || "medium"}>
          {statusLabel[value as string] || value}
        </IonBadge>
      );
      
    case "number":
      return new Intl.NumberFormat("th-TH").format(value as number);
      
    case "text":
    default:
      return String(value);
  }
};

// ============================================================================
// 组件实现
// ============================================================================

export const DataTable: React.FC<DataTableProps> = ({
  tableId,
  dataPath,
  columns,
  pagination = { enabled: true, pageSize: 20, pageSizeOptions: [10, 20, 50, 100] },
  rowActions = [],
  data = [],
  loading = false,
  emptyMessage = "暂无数据",
  onRowClick,
  onRowAction,
  onSortChange,
  className
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination.pageSize || 20);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // 排序数据
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDirection]);

  // 分页数据
  const paginatedData = useMemo(() => {
    if (!pagination.enabled) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination.enabled]);

  // 总页数
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / pageSize);
  }, [data.length, pageSize]);

  // 处理排序
  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      const newDirection = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(newDirection);
      onSortChange?.(key, newDirection);
    } else {
      setSortKey(key);
      setSortDirection("asc");
      onSortChange?.(key, "asc");
    }
  }, [sortKey, sortDirection, onSortChange]);

  // 处理页码变化
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // 处理每页数量变化
  const handlePageSizeChange = useCallback((e: CustomEvent) => {
    setPageSize(Number(e.detail.value));
    setCurrentPage(1);
  }, []);

  // 处理行操作
  const handleRowAction = useCallback((actionId: string, row: any, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onRowAction?.(actionId, row);
  }, [onRowAction]);

  // 加载状态
  if (loading) {
    return (
      <div
        className={`data-table-loading ${className || ""}`}
        style={{
          padding: "40px",
          textAlign: "center",
          color: "var(--ion-color-medium)"
        }}
      >
        加载中...
      </div>
    );
  }

  // 空状态
  if (data.length === 0) {
    return (
      <div
        className={`data-table-empty ${className || ""}`}
        style={{
          padding: "40px",
          textAlign: "center",
          color: "var(--ion-color-medium)"
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`data-table-container ${className || ""}`}>
      {/* 表格 */}
      <IonTable>
        <IonThead>
          <IonTr>
            {columns.map((column) => (
              <IonTh
                key={column.key}
                style={{
                  width: column.width,
                  cursor: column.sortable ? "pointer" : "default",
                  userSelect: "none"
                }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {column.label}
                  {column.sortable && sortKey === column.key && (
                    <IonIcon
                      icon={sortDirection === "asc" ? arrowUpOutline : arrowDownOutline}
                      style={{ fontSize: "14px" }}
                    />
                  )}
                </div>
              </IonTh>
            ))}
            {rowActions.length > 0 && (
              <IonTh style={{ width: "100px", textAlign: "right" }}>
                操作
              </IonTh>
            )}
          </IonTr>
        </IonThead>
        
        <IonTbody>
          {paginatedData.map((row, rowIndex) => (
            <IonTr
              key={row.id || rowIndex}
              style={{
                cursor: onRowClick ? "pointer" : "default"
              }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <IonTd key={`${rowIndex}-${column.key}`}>
                  {formatCellValue(row[column.key], column.type, column.format)}
                </IonTd>
              ))}
              
              {/* 行操作 */}
              {rowActions.length > 0 && (
                <IonTd style={{ textAlign: "right" }}>
                  <IonButtons>
                    {rowActions.map((action, actionIndex) => (
                      <IonButton
                        key={actionIndex}
                        size="small"
                        fill="clear"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleRowAction(action.actionId, row, e)}
                      >
                        {action.label}
                      </IonButton>
                    ))}
                  </IonButtons>
                </IonTd>
              )}
            </IonTr>
          ))}
        </IonTbody>
      </IonTable>
      
      {/* 分页 */}
      {pagination.enabled && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 0",
            borderTop: "1px solid var(--ion-color-light)"
          }}
        >
          {/* 每页数量选择 */}
          <IonItem style={{ width: "auto" }}>
            <IonLabel>每页显示</IonLabel>
            <IonSelect
              value={pageSize}
              onIonChange={handlePageSizeChange}
              interface="popover"
              style={{ width: "80px" }}
            >
              {pagination.pageSizeOptions?.map((size) => (
                <IonSelectOption key={size} value={size}>
                  {size}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          
          {/* 页码 */}
          <IonPagination
            totalButtons={5}
            currentPage={currentPage}
            totalPages={totalPages}
            onIonChange={(e: CustomEvent<{ value: number }>) => handlePageChange(e.detail.value)}
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;
