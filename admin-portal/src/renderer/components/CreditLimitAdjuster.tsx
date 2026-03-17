import React, { useState } from 'react';
import { z } from 'zod';

// 定义额度调整类型
export interface CreditLimitAdjustment {
  userId: string;
  currentLimit: number;
  newLimit: number;
  reason: string;
  effectiveDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Zod 验证 schema
export const AdjustmentSchema = z.object({
  newLimit: z.number().positive('新额度必须大于0'),
  reason: z.string().min(10, '调整原因至少需要10个字符'),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, '请选择有效的日期时间')
});

export type AdjustmentFormData = z.infer<typeof AdjustmentSchema>;

interface CreditLimitAdjusterProps {
  userId: string;
  currentLimit: number;
  onAdjustmentSubmit: (adjustmentData: CreditLimitAdjustment) => void;
  onCancelled?: () => void;
}

const CreditLimitAdjuster: React.FC<CreditLimitAdjusterProps> = ({ 
  userId, 
  currentLimit, 
  onAdjustmentSubmit,
  onCancelled
}) => {
  const [newLimit, setNewLimit] = useState<number>(currentLimit);
  const [reason, setReason] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16) // 默认明天
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const validateForm = (): boolean => {
    try {
      // 额度调整合理性校验
      if (newLimit <= 0) {
        setErrors(prev => ({ ...prev, newLimit: '新额度必须大于0' }));
        return false;
      }
      
      if (newLimit === currentLimit) {
        setErrors(prev => ({ ...prev, newLimit: '新额度不能与当前额度相同' }));
        return false;
      }
      
      // 使用 Zod 验证其他字段
      AdjustmentSchema.parse({
        newLimit,
        reason,
        effectiveDate
      });
      
      // 清除错误
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            newErrors[err.path.join('.')] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const adjustmentData: CreditLimitAdjustment = {
        userId,
        currentLimit,
        newLimit,
        reason,
        effectiveDate,
        status: 'pending'
      };
      
      await onAdjustmentSubmit(adjustmentData);
      
      // 重置表单
      setNewLimit(currentLimit);
      setReason('');
      setEffectiveDate(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    } catch (error) {
      console.error('提交额度调整失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancelled) {
      onCancelled();
    }
  };

  const calculateChangePercentage = () => {
    if (currentLimit === 0) return 0;
    return ((newLimit - currentLimit) / currentLimit) * 100;
  };

  const changePercentage = calculateChangePercentage();

  return (
    <div className="credit-limit-adjuster">
      <h2>信用额度调整</h2>
      
      <div className="current-limit-info">
        <h3>当前额度信息</h3>
        <div className="limit-display">
          <span className="label">当前额度:</span>
          <span className="value">¥{currentLimit.toLocaleString()}</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="adjustment-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="newLimit">新额度</label>
            <input
              id="newLimit"
              type="number"
              min="0"
              step="100"
              value={newLimit}
              onChange={(e) => setNewLimit(parseFloat(e.target.value) || 0)}
              className={errors.newLimit ? 'error' : ''}
            />
            {errors.newLimit && <span className="error-message">{errors.newLimit}</span>}
          </div>
          
          <div className="change-info">
            <div className={`change-value ${changePercentage >= 0 ? 'positive' : 'negative'}`}>
              {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(2)}%
            </div>
            <div className="change-amount">
              {changePercentage >= 0 ? '+' : '-'}¥{Math.abs(newLimit - currentLimit).toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="reason">调整原因</label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请输入调整信用额度的原因..."
            rows={4}
            className={errors.reason ? 'error' : ''}
          />
          {errors.reason && <span className="error-message">{errors.reason}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="effectiveDate">生效日期</label>
          <input
            id="effectiveDate"
            type="datetime-local"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className={errors.effectiveDate ? 'error' : ''}
          />
          {errors.effectiveDate && <span className="error-message">{errors.effectiveDate}</span>}
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '提交调整申请'}
          </button>
          {onCancelled && (
            <button type="button" onClick={handleCancel} disabled={isSubmitting}>
              取消
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreditLimitAdjuster;