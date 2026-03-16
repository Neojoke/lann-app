import React, { useState, useEffect, useMemo } from 'react';
import { ProductType } from './ProductConfig';

// 定义产品类型
export interface Product {
  id: string;
  name: string;
  type: ProductType;
  interestRate: number;
  fees: number;
  terms: number[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onStatusToggle: (productId: string, newStatus: 'active' | 'inactive') => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products = [], 
  onEdit, 
  onDelete, 
  onStatusToggle 
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // 搜索和过滤产品
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 搜索过滤
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 类型过滤
      const matchesType = filterType === 'all' || product.type === filterType;
      
      // 状态过滤
      const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [products, searchTerm, filterType, filterStatus]);
  
  // 排序产品
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // 如果是字符串，转换为小写进行比较
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // 如果是数组，使用第一个元素进行比较
      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        aValue = aValue[0];
        bValue = bValue[0];
      }
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredProducts, sortField, sortDirection]);
  
  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };
  
  const getStatusLabel = (status: 'active' | 'inactive') => {
    return status === 'active' ? '启用' : '禁用';
  };
  
  const getTypeLabel = (type: ProductType) => {
    switch (type) {
      case ProductType.PERSONAL: return '个人贷款';
      case ProductType.BUSINESS: return '商业贷款';
      case ProductType.MORTGAGE: return '抵押贷款';
      case ProductType.AUTO: return '汽车贷款';
      default: return type;
    }
  };
  
  return (
    <div className="product-list">
      <div className="list-header">
        <h2>产品列表</h2>
        
        {/* 搜索和筛选 */}
        <div className="filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索产品名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-selects">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ProductType | 'all')}
            >
              <option value="all">所有类型</option>
              <option value={ProductType.PERSONAL}>个人贷款</option>
              <option value={ProductType.BUSINESS}>商业贷款</option>
              <option value={ProductType.MORTGAGE}>抵押贷款</option>
              <option value={ProductType.AUTO}>汽车贷款</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            >
              <option value="all">所有状态</option>
              <option value="active">启用</option>
              <option value="inactive">禁用</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 产品表格 */}
      <div className="table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                产品名称
                {sortField === 'name' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('type')} className="sortable">
                类型
                {sortField === 'type' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('interestRate')} className="sortable">
                利率 (%)
                {sortField === 'interestRate' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('fees')} className="sortable">
                费用
                {sortField === 'fees' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>期限选项</th>
              <th onClick={() => handleSort('status')} className="sortable">
                状态
                {sortField === 'status' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('updatedAt')} className="sortable">
                更新时间
                {sortField === 'updatedAt' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.length > 0 ? (
              sortedProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{getTypeLabel(product.type)}</td>
                  <td>{product.interestRate}%</td>
                  <td>¥{product.fees.toLocaleString()}</td>
                  <td>
                    {product.terms.map((term, idx) => (
                      <span key={idx} className="term-badge">
                        {term}个月
                      </span>
                    ))}
                  </td>
                  <td>
                    <span className={`status-badge ${product.status}`}>
                      {getStatusLabel(product.status)}
                    </span>
                  </td>
                  <td>{formatDate(product.updatedAt)}</td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => onEdit(product)}
                    >
                      编辑
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => onDelete(product.id)}
                    >
                      删除
                    </button>
                    <button 
                      className={`action-btn toggle-status-btn ${product.status}`}
                      onClick={() => 
                        onStatusToggle(
                          product.id, 
                          product.status === 'active' ? 'inactive' : 'active'
                        )
                      }
                    >
                      {product.status === 'active' ? '禁用' : '启用'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="no-data">
                  没有找到符合条件的产品
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* 统计信息 */}
      <div className="list-footer">
        <div className="stats">
          <span>总数: {products.length}</span>
          <span>启用: {products.filter(p => p.status === 'active').length}</span>
          <span>禁用: {products.filter(p => p.status === 'inactive').length}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductList;