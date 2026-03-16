/**
 * ActionProvider - Action 执行上下文提供者
 * 
 * 提供统一的 Action 执行机制，支持 API 调用、错误处理和类型安全
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { actions } from "../../catalog";
import type { ZodType } from "zod";

// ============================================================================
// 类型定义
// ============================================================================

export interface ActionContextType {
  execute: <T extends keyof typeof actions>(
    actionId: T,
    input: any
  ) => Promise<any>;
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
  apiUrl: string;
}

export interface ActionProviderProps {
  apiUrl: string;
  children: React.ReactNode;
  authToken?: string;
  timeout?: number;
  onError?: (error: Error, actionId: string) => void;
}

// ============================================================================
// Context 创建
// ============================================================================

const ActionContext = createContext<ActionContextType | null>(null);

// ============================================================================
// 错误类定义
// ============================================================================

export class ActionError extends Error {
  constructor(
    message: string,
    public actionId: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export class NetworkError extends ActionError {
  constructor(message: string, actionId: string) {
    super(message, actionId, "NETWORK_ERROR");
    this.name = "NetworkError";
  }
}

export class ValidationError extends ActionError {
  constructor(message: string, actionId: string, public fieldErrors?: any) {
    super(message, actionId, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class PermissionError extends ActionError {
  constructor(message: string, actionId: string) {
    super(message, actionId, "PERMISSION_ERROR");
    this.name = "PermissionError";
  }
}

// ============================================================================
// Provider 实现
// ============================================================================

export const ActionProvider: React.FC<ActionProviderProps> = ({
  apiUrl,
  children,
  authToken,
  timeout = 30000,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(async <T extends keyof typeof actions>(
    actionId: T,
    input: any
  ): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const actionDef = actions[actionId];
      if (!actionDef) {
        throw new ActionError(
          `Unknown action: ${String(actionId)}`,
          String(actionId),
          "UNKNOWN_ACTION"
        );
      }

      if (actionDef.input) {
        const parseResult = actionDef.input.safeParse(input);
        if (!parseResult.success) {
          const fieldErrors = parseResult.error.errors.map((err: any) => ({
            field: err.path.join("."),
            message: err.message
          }));
          throw new ValidationError(
            "Action input validation failed",
            String(actionId),
            fieldErrors
          );
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${apiUrl}/admin/api/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { "Authorization": `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          actionId,
          input
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch((): any => ({}));
        
        switch (response.status) {
          case 400:
            throw new ValidationError(
              errorData.message || "Invalid input",
              String(actionId),
              errorData.details
            );
          case 401:
          case 403:
            throw new PermissionError(
              errorData.message || "Permission denied",
              String(actionId)
            );
          case 404:
            throw new ActionError(
              errorData.message || "Action not found",
              String(actionId),
              "NOT_FOUND"
            );
          case 500:
            throw new ActionError(
              errorData.message || "Internal server error",
              String(actionId),
              "SERVER_ERROR"
            );
          default:
            throw new ActionError(
              errorData.message || `Request failed: ${response.statusText}`,
              String(actionId),
              `HTTP_${response.status}`
            );
        }
      }

      const result = await response.json();
      return result;
    } catch (err) {
      let actionError: ActionError;
      
      if (err instanceof ActionError) {
        actionError = err;
      } else if (err instanceof Error) {
        if (err.name === "AbortError") {
          actionError = new ActionError("Request timeout", String(actionId), "TIMEOUT");
        } else if (err.message.includes("fetch") || err.message.includes("network")) {
          actionError = new NetworkError("Network error. Please check your connection.", String(actionId));
        } else {
          actionError = new ActionError(err.message, String(actionId), "UNKNOWN");
        }
      } else {
        actionError = new ActionError("An unexpected error occurred", String(actionId), "UNKNOWN");
      }
      
      setError(actionError);
      onError?.(actionError, String(actionId));
      throw actionError;
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, authToken, timeout, onError]);

  const contextValue = useMemo<ActionContextType>(() => ({
    execute,
    isLoading,
    error,
    clearError,
    apiUrl
  }), [execute, isLoading, error, clearError, apiUrl]);

  return (
    <ActionContext.Provider value={contextValue}>
      {children}
    </ActionContext.Provider>
  );
};

// ============================================================================
// Hook 导出
// ============================================================================

export const useAction = (): ActionContextType => {
  const context = useContext(ActionContext);
  
  if (!context) {
    throw new Error("useAction must be used within an ActionProvider.");
  }
  
  return context;
};

export const useActionSafe = (): ActionContextType | null => {
  return useContext(ActionContext);
};

export default ActionProvider;
