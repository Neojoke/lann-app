import React, { useState } from 'react';
import { z } from 'zod';

// 定义产品类型枚举
export enum ProductType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  MORTGAGE = 'mortgage',
  AUTO = 'auto'
}

// Zod 验证 schema
export const ProductSchema = z.object({
  name: z.string().min(1, '产品名称不能为空'),
  type: z.nativeEnum(ProductType),
  interestRate: z.number().min(0, '利率不能小于0').max(100, '利率不能大于100'),
  fees: z.number().min(0, '费用不能小于0'),
  terms: z.array(z.number()).nonempty('至少需要一个期限选项'),
  status: z.enum(['active', 'inactive']).default('inactive')
});

export type ProductFormData = z.infer<typeof ProductSchema>;

interface ProductConfigProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onCancel?: () => void;
}

const ProductConfig: React.FC<ProductConfigProps> = ({ 
  initialData = {}, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData.name || '',
    type: initialData.type || ProductType.PERSONAL,
    interestRate: initialData.interestRate || 0,
    fees: initialData.fees || 0,
    terms: initialData.terms || [12, 24, 36],
    status: initialData.status || 'inactive'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [termInput, setTermInput] = useState<string>('');

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddTerm = () => {
    if (termInput.trim() === '') return;

    const termValue = parseInt(termInput.trim(), 10);
    if (isNaN(termValue) || termValue <= 0) {
      setErrors(prev => ({ ...prev, terms: '请输入有效的期限值' }));
      return;
    }

    if (!formData.terms.includes(termValue)) {
      handleChange('terms', [...formData.terms, termValue]);
    }
    
    setTermInput('');
  };

  const handleRemoveTerm = (index: number) => {
    const newTerms = [...formData.terms];
    newTerms.splice(index, 1);
    handleChange('terms', newTerms);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 使用 Zod 验证数据
      ProductSchema.parse(formData);
      
      // 清除之前的错误
      setErrors({});
      
      // 提交数据
      onSubmit(formData);
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
    }
  };

  return (
    <div className="product-config-form">
      <h2>产品配置</h2>
      <form onSubmit={handleSubmit}>
        {/* 产品基本信息 */}
        <div className="form-section">
          <h3>基本信息</h3>
          
          <div className="form-field">
            <label htmlFor="productName">产品名称 *</label>
            <input
              id="productName"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          
          <div className="form-field">
            <label htmlFor="productType">产品类型</label>
            <select
              id="productType"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as ProductType)}
            >
              <option value={ProductType.PERSONAL}>个人贷款</option>
              <option value={ProductType.BUSINESS}>商业贷款</option>
              <option value={ProductType.MORTGAGE}>抵押贷款</option>
              <option value={ProductType.AUTO}>汽车贷款</option>
            </select>
          </div>
        </div>

        {/* 费率配置 */}
        <div className="form-section">
          <h3>费率配置</h3>
          
          <div className="form-field">
            <label htmlFor="interestRate">利率 (%)</label>
            <input
              id="interestRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.interestRate}
              onChange={(e) => handleChange('interestRate', parseFloat(e.target.value))}
              className={errors.interestRate ? 'error' : ''}
            />
            {errors.interestRate && <span className="error-message">{errors.interestRate}</span>}
          </div>
          
          <div className="form-field">
            <label htmlFor="fees">费用</label>
            <input
              id="fees"
              type="number"
              step="0.01"
              min="0"
              value={formData.fees}
              onChange={(e) => handleChange('fees', parseFloat(e.target.value))}
              className={errors.fees ? 'error' : ''}
            />
            {errors.fees && <span className="error-message">{errors.fees}</span>}
          </div>
        </div>

        {/* 期限配置 */}
        <div className="form-section">
          <h3>期限配置</h3>
          
          <div className="form-field">
            <label>期限选项 (月)</label>
            <div className="terms-input">
              <input
                type="number"
                min="1"
                placeholder="输入期限值"
                value={termInput}
                onChange={(e) => setTermInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTerm()}
                className={errors.terms ? 'error' : ''}
              />
              <button type="button" onClick={handleAddTerm}>添加</button>
            </div>
            {errors.terms && <span className="error-message">{errors.terms}</span>}
            
            <div className="selected-terms">
              {formData.terms.map((term, index) => (
                <div key={index} className="term-tag">
                  {term}个月
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTerm(index)}
                    className="remove-term-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 状态管理 */}
        <div className="form-section">
          <h3>状态管理</h3>
          
          <div className="form-field">
            <label>
              <input
                type="radio"
                name="status"
                checked={formData.status === 'active'}
                onChange={() => handleChange('status', 'active')}
              />
              启用
            </label>
            <label>
              <input
                type="radio"
                name="status"
                checked={formData.status === 'inactive'}
                onChange={() => handleChange('status', 'inactive')}
              />
              禁用
            </label>
          </div>
        </div>

        {/* 表单操作按钮 */}
        <div className="form-actions">
          <button type="submit">保存</button>
          {onCancel && <button type="button" onClick={onCancel}>取消</button>}
        </div>
      </form>
    </div>
  );
};

export default ProductConfig;