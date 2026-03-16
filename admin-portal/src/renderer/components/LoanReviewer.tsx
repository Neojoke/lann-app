import React, { useState, useEffect } from 'react';

// 定义审核状态枚举
export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_INFO = 'needs_info'
}

// 定义借款详情类型
export interface LoanDetails {
  id: string;
  applicantName: string;
  loanAmount: number;
  loanTerm: number;
  interestRate: number;
  applicationDate: string;
  status: ReviewStatus;
  creditScore?: number;
  employmentStatus?: string;
  income?: number;
  documents?: string[];
  remarks?: string;
}

// 定义审核记录类型
export interface ReviewRecord {
  id: string;
  reviewer: string;
  status: ReviewStatus;
  comment: string;
  timestamp: string;
  action: 'approve' | 'reject' | 'request_info';
}

interface LoanReviewerProps {
  loanId: string;
  initialLoanDetails: LoanDetails;
  onReviewSubmit: (reviewData: {
    status: ReviewStatus;
    comment: string;
    action: 'approve' | 'reject' | 'request_info';
  }) => void;
  reviewers: string[]; // 可审核的人员列表
}

const LoanReviewer: React.FC<LoanReviewerProps> = ({ 
  loanId, 
  initialLoanDetails, 
  onReviewSubmit,
  reviewers = []
}) => {
  const [loanDetails, setLoanDetails] = useState<LoanDetails>(initialLoanDetails);
  const [comment, setComment] = useState<string>('');
  const [action, setAction] = useState<'approve' | 'reject' | 'request_info'>('approve');
  const [reviewHistory, setReviewHistory] = useState<ReviewRecord[]>([]);
  
  // 模拟加载审核历史记录
  useEffect(() => {
    // 模拟从API获取审核历史
    const mockHistory: ReviewRecord[] = [
      {
        id: '1',
        reviewer: 'John Doe',
        status: ReviewStatus.PENDING,
        comment: '待审核',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        action: 'approve'
      },
      {
        id: '2',
        reviewer: 'Jane Smith',
        status: ReviewStatus.NEEDS_INFO,
        comment: '需要补充收入证明',
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        action: 'request_info'
      }
    ];
    
    setReviewHistory(mockHistory);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 更新贷款状态
    let newStatus: ReviewStatus;
    switch (action) {
      case 'approve':
        newStatus = ReviewStatus.APPROVED;
        break;
      case 'reject':
        newStatus = ReviewStatus.REJECTED;
        break;
      case 'request_info':
        newStatus = ReviewStatus.NEEDS_INFO;
        break;
      default:
        newStatus = ReviewStatus.PENDING;
    }
    
    // 提交审核
    onReviewSubmit({
      status: newStatus,
      comment,
      action
    });
    
    // 重置表单
    setComment('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="loan-reviewer">
      <h2>贷款审核</h2>
      
      {/* 借款详情展示 */}
      <div className="loan-details">
        <h3>借款详情</h3>
        <div className="details-grid" data-testid="loan-details-grid">
          <div className="detail-item">
            <strong>申请人:</strong> {loanDetails.applicantName}
          </div>
          <div className="detail-item">
            <strong>贷款金额:</strong> ¥{loanDetails.loanAmount.toLocaleString()}
          </div>
          <div className="detail-item">
            <strong>贷款期限:</strong> {loanDetails.loanTerm}个月
          </div>
          <div className="detail-item">
            <strong>利率:</strong> {loanDetails.interestRate}%
          </div>
          <div className="detail-item">
            <strong>申请日期:</strong> {formatDate(loanDetails.applicationDate)}
          </div>
          {loanDetails.creditScore !== undefined && (
            <div className="detail-item">
              <strong>信用评分:</strong> {loanDetails.creditScore}
            </div>
          )}
          {loanDetails.employmentStatus && (
            <div className="detail-item">
              <strong>就业状况:</strong> {loanDetails.employmentStatus}
            </div>
          )}
          {loanDetails.income !== undefined && (
            <div className="detail-item">
              <strong>收入:</strong> ¥{loanDetails.income.toLocaleString()}
            </div>
          )}
          <div className="detail-item">
            <strong>当前状态:</strong> 
            <span className={`status-badge ${loanDetails.status}`}>
              {loanDetails.status === 'pending' && '待审核'}
              {loanDetails.status === 'approved' && '已批准'}
              {loanDetails.status === 'rejected' && '已拒绝'}
              {loanDetails.status === 'needs_info' && '需要更多信息'}
            </span>
          </div>
        </div>
        
        {/* 文档列表 */}
        {loanDetails.documents && loanDetails.documents.length > 0 && (
          <div className="documents-section">
            <h4>相关文档</h4>
            <ul>
              {loanDetails.documents.map((doc, index) => (
                <li key={index}>{doc}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* 审核操作 */}
      <div className="review-actions">
        <h3>审核操作</h3>
        <form onSubmit={handleSubmit}>
          <div className="action-options">
            <label>
              <input
                type="radio"
                name="action"
                value="approve"
                checked={action === 'approve'}
                onChange={() => setAction('approve')}
              />
              批准
            </label>
            <label>
              <input
                type="radio"
                name="action"
                value="reject"
                checked={action === 'reject'}
                onChange={() => setAction('reject')}
              />
              拒绝
            </label>
            <label>
              <input
                type="radio"
                name="action"
                value="request_info"
                checked={action === 'request_info'}
                onChange={() => setAction('request_info')}
              />
              补充材料
            </label>
          </div>
          
          <div className="form-field">
            <label htmlFor="comment">审核意见</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="请输入您的审核意见..."
              rows={4}
            />
          </div>
          
          <button type="submit" className={`action-btn ${action}`}>
            {action === 'approve' && '批准申请'}
            {action === 'reject' && '拒绝申请'}
            {action === 'request_info' && '要求补充材料'}
          </button>
        </form>
      </div>
      
      {/* 审核历史记录 */}
      <div className="review-history">
        <h3>审核历史</h3>
        {reviewHistory.length > 0 ? (
          <div className="history-list">
            {reviewHistory.map((record) => (
              <div key={record.id} className="history-item">
                <div className="history-header">
                  <span className="reviewer">{record.reviewer}</span>
                  <span className="timestamp">{formatDate(record.timestamp)}</span>
                  <span className={`status-badge ${record.status}`}>
                    {record.status === 'pending' && '待审核'}
                    {record.status === 'approved' && '已批准'}
                    {record.status === 'rejected' && '已拒绝'}
                    {record.status === 'needs_info' && '需要更多信息'}
                  </span>
                </div>
                <div className="history-comment">
                  <strong>操作:</strong> 
                  {record.action === 'approve' && '批准'}
                  {record.action === 'reject' && '拒绝'}
                  {record.action === 'request_info' && '要求补充材料'}
                  <br />
                  <strong>意见:</strong> {record.comment}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>暂无审核历史</p>
        )}
      </div>
    </div>
  );
};

export default LoanReviewer;