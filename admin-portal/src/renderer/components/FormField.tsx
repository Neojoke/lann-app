/**
 * FormField - 通用表单字段组件
 * 
 * 支持多种输入类型和验证规则
 * 
 * @component
 * @example
 * ```tsx
 * <FormField
 *   fieldId="email"
 *   label="邮箱"
 *   type="email"
 *   valuePath="/form/email"
 *   required
 *   checks={[
 *     { fn: "required", message: "邮箱不能为空" },
 *     { fn: "email", message: "请输入有效的邮箱地址" }
 *   ]}
 * />
 * ```
 */

import React, { useState, useCallback } from "react";
import {
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonText,
  IonIcon,
  IonCheckbox,
  IonRadio,
  IonRadioGroup
} from "@ionic/react";
import { alertCircleOutline, checkmarkCircleOutline } from "ionicons/icons";

// ============================================================================
// 类型定义
// ============================================================================

export interface ValidationCheck {
  fn: "required" | "email" | "min" | "max" | "pattern";
  value?: string | number;
  message: string;
}

export interface FormFieldProps {
  /** 字段唯一标识 */
  fieldId: string;
  /** 字段标签 */
  label: string;
  /** 字段类型 */
  type: "text" | "number" | "email" | "tel" | "date" | "select" | "textarea" | "checkbox" | "radio";
  /** 数据绑定路径 */
  valuePath: string;
  /** 是否必填 */
  required?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 帮助文本 */
  helpText?: string;
  /** 验证规则 */
  checks?: ValidationCheck[];
  /** 验证触发时机 */
  validateOn?: "blur" | "change" | "submit";
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可见 */
  visible?: boolean;
  /** 选项列表（select/radio 类型使用） */
  options?: Array<{ label: string; value: string | number }>;
  /** 当前值（由父组件控制） */
  value?: any;
  /** 值变化回调 */
  onChange?: (valuePath: string, value: any) => void;
  /** 错误信息 */
  error?: string;
}

// ============================================================================
// 验证函数
// ============================================================================

/**
 * 验证字段值
 */
export const validateField = (
  value: any,
  checks: ValidationCheck[] = []
): string | null => {
  for (const check of checks) {
    switch (check.fn) {
      case "required":
        if (value === undefined || value === null || value === "") {
          return check.message;
        }
        break;
        
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return check.message;
        }
        break;
        
      case "min":
        if (value !== undefined && value !== null && value < (check.value as number)) {
          return check.message;
        }
        break;
        
      case "max":
        if (value !== undefined && value !== null && value > (check.value as number)) {
          return check.message;
        }
        break;
        
      case "pattern":
        if (value && check.value) {
          const regex = new RegExp(check.value as string);
          if (!regex.test(value)) {
            return check.message;
          }
        }
        break;
    }
  }
  return null;
};

// ============================================================================
// 组件实现
// ============================================================================

export const FormField: React.FC<FormFieldProps> = ({
  fieldId,
  label,
  type,
  valuePath,
  required,
  placeholder,
  helpText,
  checks,
  validateOn = "blur",
  disabled = false,
  visible = true,
  options,
  value,
  onChange,
  error: externalError
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 合并内部和外部错误
  const displayError = externalError || error;

  // 验证值
  const validateValue = useCallback((val: any) => {
    if (!checks || checks.length === 0) return null;
    return validateField(val, checks);
  }, [checks]);

  // 处理值变化
  const handleChange = useCallback((newValue: any) => {
    setInternalValue(newValue);
    
    if (onChange) {
      onChange(valuePath, newValue);
    }
    
    // 如果是 change 验证模式，立即验证
    if (validateOn === "change" && checks) {
      const validationError = validateValue(newValue);
      setError(validationError);
    }
  }, [valuePath, onChange, validateOn, checks, validateValue]);

  // 处理失焦
  const handleBlur = useCallback(() => {
    setTouched(true);
    
    // 如果是 blur 验证模式，失焦时验证
    if (validateOn === "blur" && checks) {
      const validationError = validateValue(internalValue);
      setError(validationError);
    }
  }, [validateOn, checks, internalValue, validateValue]);

  // 不渲染不可见字段
  if (!visible) {
    return null;
  }

  // 渲染不同类型的输入
  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      value: value !== undefined ? value : internalValue,
      placeholder,
      required,
      disabled,
      onIonChange: (e: CustomEvent) => handleChange(e.detail.value),
      onBlur: handleBlur
    };

    switch (type) {
      case "textarea":
        return (
          <IonTextarea
            {...commonProps}
            rows={4}
            autoGrow
          />
        );
        
      case "select":
        return (
          <IonSelect
            {...commonProps}
            interface="popover"
            placeholder={placeholder}
          >
            {options?.map((option) => (
              <IonSelectOption
                key={option.value}
                value={option.value}
              >
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        );
        
      case "checkbox":
        return (
          <IonItem>
            <IonCheckbox
              id={fieldId}
              checked={!!internalValue}
              disabled={disabled}
              onIonChange={(e: CustomEvent) => handleChange(e.detail.checked)}
            />
            <IonLabel>{label}</IonLabel>
          </IonItem>
        );
        
      case "radio":
        return (
          <IonRadioGroup
            value={internalValue}
            onIonChange={(e: CustomEvent) => handleChange(e.detail.value)}
          >
            {options?.map((option) => (
              <IonItem key={option.value}>
                <IonLabel>{option.label}</IonLabel>
                <IonRadio
                  slot="start"
                  value={option.value}
                  disabled={disabled}
                />
              </IonItem>
            ))}
          </IonRadioGroup>
        );
        
      default:
        return (
          <IonInput
            {...commonProps}
            type={type === "number" ? "number" : type === "tel" ? "tel" : type}
            inputmode={type === "number" ? "numeric" : type === "tel" ? "tel" : undefined}
          />
        );
    }
  };

  // Checkbox 和 Radio 特殊处理
  if (type === "checkbox" || type === "radio") {
    return (
      <>
        {renderInput()}
        {displayError && touched && (
          <IonItem lines="none">
            <IonText color="danger">
              <small>
                <IonIcon icon={alertCircleOutline} style={{ marginRight: "4px" }} />
                {displayError}
              </small>
            </IonText>
          </IonItem>
        )}
      </>
    );
  }

  // 标准表单字段
  return (
    <IonItem>
      <IonLabel position="stacked">
        {label}
        {required && <IonText color="danger"> *</IonText>}
      </IonLabel>
      
      {renderInput()}
      
      {displayError && touched && (
        <IonText color="danger" slot="error">
          <small>
            <IonIcon icon={alertCircleOutline} style={{ marginRight: "4px" }} />
            {displayError}
          </small>
        </IonText>
      )}
      
      {helpText && !displayError && (
        <IonText color="medium" slot="helper">
          <small>{helpText}</small>
        </IonText>
      )}
    </IonItem>
  );
};

export default FormField;
