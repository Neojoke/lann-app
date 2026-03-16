/**
 * 合同服务 - Contract Service
 * 
 * 负责电子合同生成、合同模板 (双语)、电子签名验证、合同存储 (R2/本地)
 */

import { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { Loan } from './loan-application.service';

// ============ 类型定义 ============

export interface Contract {
  id: string;
  loanId: string;
  userId: string;
  contractUrl: string;
  contractType: 'loan_agreement' | 'terms_conditions' | 'privacy_policy';
  language: 'en' | 'th';
  version: string;
  status: 'draft' | 'pending_signature' | 'signed' | 'completed';
  signatureData?: SignatureData;
  signedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignatureData {
  signatureImage: string; // Base64
  signedAt: string;
  ipAddress: string;
  userAgent: string;
  verified: boolean;
}

export interface ContractTemplate {
  id: string;
  type: Contract['contractType'];
  language: 'en' | 'th';
  version: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

// ============ 合同模板 (双语) ============

const LOAN_AGREEMENT_TEMPLATE_EN = `
# LOAN AGREEMENT

**Agreement Number:** {{contract_id}}  
**Date:** {{date}}

## PARTIES

This Loan Agreement ("Agreement") is entered into between:

**Lender:**  
Lann Financial Services Co., Ltd.  
Address: 123 Financial District, Bangkok, Thailand  
Registration No: 1234567890123

**Borrower:**  
Name: {{borrower_name}}  
ID Card No: {{borrower_id}}  
Address: {{borrower_address}}  
Phone: {{borrower_phone}}

## LOAN DETAILS

1. **Loan Amount (Principal):** {{principal}} THB
2. **Interest Rate:** {{interest_rate}}% per {{interest_type}}
3. **Loan Term:** {{term_days}} days
4. **Total Interest:** {{total_interest}} THB
5. **Total Repayment Amount:** {{total_repayment}} THB
6. **Due Date:** {{due_date}}
7. **Repayment Method:** {{repayment_method}}

## TERMS AND CONDITIONS

### 1. Disbursement
The Lender shall disburse the loan amount to the Borrower's designated bank account within 1 business day after this Agreement is signed.

### 2. Repayment
The Borrower agrees to repay the full amount (principal + interest) on or before the due date.

### 3. Late Payment
If the Borrower fails to repay on time:
- Late fee: 0.5% per day on the outstanding amount
- Minimum late fee: 50 THB
- The Lender may take legal action if payment is overdue by more than 30 days

### 4. Prepayment
The Borrower may repay the loan early without any prepayment penalty. Interest will be calculated based on the actual number of days the loan was outstanding.

### 5. Default
If the Borrower fails to repay within 90 days of the due date, the loan will be considered in default and may be written off. This will negatively affect the Borrower's credit score.

### 6. Governing Law
This Agreement shall be governed by and construed in accordance with the laws of Thailand.

### 7. Dispute Resolution
Any disputes arising from this Agreement shall be resolved through negotiation. If negotiation fails, the dispute shall be submitted to the competent court in Bangkok.

## BORROWER'S DECLARATION

I, the undersigned Borrower, hereby declare that:
1. I have read and understood all terms and conditions of this Agreement.
2. I agree to repay the loan according to the terms specified above.
3. I understand the consequences of late payment and default.

**Borrower's Signature:** {{signature}}  
**Date:** {{signed_date}}

---

**For Lann Financial Services Co., Ltd.**

Authorized Signature: _________________  
Name: _________________  
Position: _________________  
Date: _________________
`;

const LOAN_AGREEMENT_TEMPLATE_TH = `
# สัญญาเงินกู้

**เลขที่สัญญา:** {{contract_id}}  
**วันที่:** {{date}}

## คู่สัญญา

สัญญาเงินกู้ฉบับนี้ ("สัญญา") ทำขึ้นระหว่าง:

**ผู้ให้กู้:**  
บริษัท แล่น การเงิน จำกัด  
ที่อยู่: 123 ย่านการเงิน กรุงเทพมหานคร ประเทศไทย  
เลขทะเบียน: 1234567890123

**ผู้กู้:**  
ชื่อ: {{borrower_name}}  
เลขบัตรประชาชน: {{borrower_id}}  
ที่อยู่: {{borrower_address}}  
โทรศัพท์: {{borrower_phone}}

## รายละเอียดเงินกู้

1. **จำนวนเงินกู้ (เงินต้น):** {{principal}} บาท
2. **อัตราดอกเบี้ย:** {{interest_rate}}% ต่อ {{interest_type}}
3. **ระยะเวลากู้:** {{term_days}} วัน
4. **ดอกเบี้ยรวม:** {{total_interest}} บาท
5. **จำนวนเงินที่ต้องชำระรวม:** {{total_repayment}} บาท
6. **วันครบกำหนดชำระ:** {{due_date}}
7. **วิธีการชำระ:** {{repayment_method}}

## เงื่อนไขและข้อตกลง

### 1. การปล่อยกู้
ผู้ให้กู้จะโอนเงินกู้เข้าบัญชีธนาคารที่ผู้กู้กำหนดภายใน 1 วันทำการหลังจากสัญญานี้ได้รับการลงนาม

### 2. การชำระคืน
ผู้กู้ตกลงที่จะชำระคืนเต็มจำนวน (เงินต้น + ดอกเบี้ย) ภายในหรือก่อนวันครบกำหนดชำระ

### 3. การชำระล่าช้า
หากผู้กู้ไม่ชำระตามกำหนด:
- ค่าปรับล่าช้า: 0.5% ต่อวัน จากยอดค้างชำระ
- ค่าปรับล่าช้าขั้นต่ำ: 50 บาท
- ผู้ให้กู้อาจดำเนินคดีทางกฎหมายหากค้างชำระเกิน 30 วัน

### 4. การชำระก่อนกำหนด
ผู้กู้สามารถชำระคืนก่อนกำหนดได้โดยไม่มีค่าธรรมเนียม ดอกเบี้ยจะคำนวณตามจำนวนวันที่ใช้เงินกู้จริง

### 5. การผิดนัดชำระ
หากผู้กู้ไม่ชำระคืนภายใน 90 วันหลังจากวันครบกำหนดชำระ เงินกู้จะถือว่าผิดนัดชำระและอาจถูกตัดจำหน่าย สิ่งนี้จะส่งผลกระทบเชิงลบต่อคะแนนเครดิตของผู้กู้

### 6. กฎหมายที่ใช้บังคับ
สัญญานี้อยู่ภายใต้และตีความตามกฎหมายของประเทศไทย

### 7. การระงับข้อพิพาท
ข้อพิพาทใดๆ ที่เกิดจากสัญญานี้จะแก้ไขผ่านการเจรจา หากการเจรจาไม่สำเร็จ ข้อพิพาทจะถูกยื่นต่อศาลที่มีอำนาจในกรุงเทพมหานคร

## คำแถลงของผู้กู้

ข้าพเจ้าผู้กู้ข้างล่างนี้ ขอแถลงว่า:
1. ข้าพเจ้าได้อ่านและเข้าใจเงื่อนไขและข้อตกลงทั้งหมดของสัญญานี้
2. ข้าพเจ้าตกลงที่จะชำระคืนเงินกู้ตามเงื่อนไขที่ระบุข้างต้น
3. ข้าพเจ้าเข้าใจผลกระทบของการชำระล่าช้าและการผิดนัดชำระ

**ลายเซ็นผู้กู้:** {{signature}}  
**วันที่:** {{signed_date}}

---

**สำหรับ บริษัท แล่น การเงิน จำกัด**

ลายเซ็นผู้มีอำนาจ: _________________  
ชื่อ: _________________  
ตำแหน่ง: _________________  
วันที่: _________________
`;

const DEFAULT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'loan_agreement_en_v1',
    type: 'loan_agreement',
    language: 'en',
    version: '1.0.0',
    content: LOAN_AGREEMENT_TEMPLATE_EN,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'loan_agreement_th_v1',
    type: 'loan_agreement',
    language: 'th',
    version: '1.0.0',
    content: LOAN_AGREEMENT_TEMPLATE_TH,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// ============ 多语言错误消息 ============

const ERROR_MESSAGES: Record<string, { en: string; th: string }> = {
  CONTRACT_NOT_FOUND: {
    en: 'Contract not found',
    th: 'ไม่พบสัญญา',
  },
  LOAN_NOT_FOUND: {
    en: 'Loan not found',
    th: 'ไม่พบเงินกู้',
  },
  INVALID_SIGNATURE: {
    en: 'Invalid signature',
    th: 'ลายเซ็นไม่ถูกต้อง',
  },
  CONTRACT_ALREADY_SIGNED: {
    en: 'Contract has already been signed',
    th: 'สัญญาได้รับการลงนามแล้ว',
  },
  TEMPLATE_NOT_FOUND: {
    en: 'Contract template not found',
    th: 'ไม่พบเทมเพลตสัญญา',
  },
};

export class ContractService {
  private db: D1Database;
  private bucket?: R2Bucket;

  constructor(db: D1Database, bucket?: R2Bucket) {
    this.db = db;
    this.bucket = bucket;
  }

  /**
   * 初始化默认模板
   */
  async initializeTemplates(): Promise<void> {
    for (const template of DEFAULT_TEMPLATES) {
      await this.db.execute(`
        INSERT OR IGNORE INTO contract_templates (
          id, type, language, version, content, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        template.id,
        template.type,
        template.language,
        template.version,
        template.content,
        template.isActive ? 1 : 0,
        template.createdAt,
      ]);
    }
  }

  /**
   * 生成合同
   */
  async generateContract(
    loan: Loan,
    borrowerInfo: {
      name: string;
      nationalId: string;
      address: string;
      phone: string;
    },
    language: 'en' | 'th' = 'th'
  ): Promise<{ success: boolean; contract?: Contract; error?: { code: string; message: string } }> {
    try {
      // 1. 获取合同模板
      const template = await this.getTemplate('loan_agreement', language);
      if (!template) {
        return {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: ERROR_MESSAGES.TEMPLATE_NOT_FOUND[language],
          },
        };
      }

      // 2. 填充模板
      const contractId = 'contract_' + Date.now().toString(36);
      const now = new Date().toISOString();
      const dueDate = new Date(loan.dueDate);

      const content = template.content
        .replace('{{contract_id}}', contractId)
        .replace('{{date}}', now.split('T')[0])
        .replace('{{borrower_name}}', borrowerInfo.name)
        .replace('{{borrower_id}}', borrowerInfo.nationalId)
        .replace('{{borrower_address}}', borrowerInfo.address)
        .replace('{{borrower_phone}}', borrowerInfo.phone)
        .replace('{{principal}}', loan.principal.toFixed(2))
        .replace('{{interest_rate}}', (loan.interestRate * 100).toFixed(2))
        .replace('{{interest_type}}', loan.termDays > 30 ? 'month' : 'day')
        .replace('{{term_days}}', loan.termDays.toString())
        .replace('{{total_interest}}', loan.totalInterest.toFixed(2))
        .replace('{{total_repayment}}', loan.totalRepayment.toFixed(2))
        .replace('{{due_date}}', dueDate.toISOString().split('T')[0])
        .replace('{{repayment_method}}', 'Bank Transfer');

      // 3. 创建合同记录
      await this.db.execute(`
        INSERT INTO contracts (
          id, loan_id, user_id, contract_type, language, version,
          content, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        contractId,
        loan.id,
        loan.userId,
        'loan_agreement',
        language,
        template.version,
        content,
        'pending_signature',
        now,
        now,
      ]);

      // 4. 存储到 R2 (如果有 bucket)
      let contractUrl = '';
      if (this.bucket) {
        const key = `contracts/${loan.userId}/${contractId}.md`;
        await this.bucket.put(key, content, {
          customMetadata: {
            loanId: loan.id,
            language: language,
            status: 'pending_signature',
          },
        });
        contractUrl = `https://storage.lann.co.th/${key}`;
      } else {
        // 本地存储 (开发环境)
        contractUrl = `local://contracts/${contractId}.md`;
      }

      // 5. 更新合同 URL
      await this.db.execute(
        'UPDATE contracts SET contract_url = ? WHERE id = ?',
        [contractUrl, contractId]
      );

      const contract: Contract = {
        id: contractId,
        loanId: loan.id,
        userId: loan.userId,
        contractUrl,
        contractType: 'loan_agreement',
        language,
        version: template.version,
        status: 'pending_signature',
        createdAt: now,
        updatedAt: now,
      };

      return {
        success: true,
        contract,
      };
    } catch (error) {
      console.error('Generate contract error:', error);
      throw error;
    }
  }

  /**
   * 验证并签署合同
   */
  async signContract(
    contractId: string,
    signature: string,
    clientInfo: {
      ipAddress: string;
      userAgent: string;
    },
    lang: 'en' | 'th' = 'en'
  ): Promise<{ success: boolean; contract?: Contract; error?: { code: string; message: string } }> {
    try {
      const now = new Date().toISOString();

      // 1. 获取合同
      const contractResult = await this.db.execute(
        'SELECT * FROM contracts WHERE id = ?',
        [contractId]
      );

      if (!contractResult.results || contractResult.results.length === 0) {
        return {
          success: false,
          error: {
            code: 'CONTRACT_NOT_FOUND',
            message: ERROR_MESSAGES.CONTRACT_NOT_FOUND[lang],
          },
        };
      }

      const contract = contractResult.results[0] as any;

      if (contract.status === 'signed' || contract.status === 'completed') {
        return {
          success: false,
          error: {
            code: 'CONTRACT_ALREADY_SIGNED',
            message: ERROR_MESSAGES.CONTRACT_ALREADY_SIGNED[lang],
          },
        };
      }

      // 2. 验证签名 (简单验证，实际应使用更复杂的验证)
      const isValidSignature = this.verifySignature(signature, contract);
      if (!isValidSignature) {
        return {
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: ERROR_MESSAGES.INVALID_SIGNATURE[lang],
          },
        };
      }

      // 3. 更新合同状态
      const signatureData: SignatureData = {
        signatureImage: signature,
        signedAt: now,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        verified: true,
      };

      await this.db.execute(`
        UPDATE contracts SET
          status = 'signed',
          signature_data = ?,
          signed_at = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        JSON.stringify(signatureData),
        now,
        now,
        contractId,
      ]);

      // 4. 更新借款状态
      await this.db.execute(`
        UPDATE loans SET
          status = 'signing',
          contract_url = ?,
          signed_at = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        contract.contract_url,
        now,
        now,
        contract.loan_id,
      ]);

      const updatedContract: Contract = {
        id: contract.id,
        loanId: contract.loan_id,
        userId: contract.user_id,
        contractUrl: contract.contract_url,
        contractType: contract.contract_type,
        language: contract.language,
        version: contract.version,
        status: 'signed',
        signatureData,
        signedAt: now,
        createdAt: contract.created_at,
        updatedAt: now,
      };

      return {
        success: true,
        contract: updatedContract,
      };
    } catch (error) {
      console.error('Sign contract error:', error);
      throw error;
    }
  }

  /**
   * 验证签名
   */
  private verifySignature(signature: string, contract: any): boolean {
    // 简单验证：检查签名是否为空
    // 实际应实现更复杂的验证逻辑 (如数字签名、生物识别等)
    if (!signature || signature.length < 10) {
      return false;
    }

    // 验证签名格式 (Base64)
    try {
      atob(signature);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取合同
   */
  async getContract(contractId: string): Promise<Contract | null> {
    const result = await this.db.execute(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    if (!result.results || result.results.length === 0) {
      return null;
    }

    const row = result.results[0] as any;
    return {
      id: row.id,
      loanId: row.loan_id,
      userId: row.user_id,
      contractUrl: row.contract_url,
      contractType: row.contract_type,
      language: row.language,
      version: row.version,
      status: row.status,
      signatureData: row.signature_data ? JSON.parse(row.signature_data) : undefined,
      signedAt: row.signed_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 获取合同模板
   */
  async getTemplate(
    type: Contract['contractType'],
    language: 'en' | 'th'
  ): Promise<ContractTemplate | null> {
    const result = await this.db.execute(
      `SELECT * FROM contract_templates 
       WHERE type = ? AND language = ? AND is_active = 1 
       ORDER BY version DESC LIMIT 1`,
      [type, language]
    );

    if (!result.results || result.results.length === 0) {
      return null;
    }

    const row = result.results[0] as any;
    return {
      id: row.id,
      type: row.type,
      language: row.language,
      version: row.version,
      content: row.content,
      isActive: !!row.is_active,
      createdAt: row.created_at,
    };
  }

  /**
   * 完成合同 (放款后)
   */
  async completeContract(contractId: string): Promise<void> {
    const now = new Date().toISOString();

    await this.db.execute(`
      UPDATE contracts SET
        status = 'completed',
        completed_at = ?,
        updated_at = ?
      WHERE id = ?
    `, [now, now, contractId]);

    await this.db.execute(
      'UPDATE loans SET status = \'active\', updated_at = ? WHERE id = (SELECT loan_id FROM contracts WHERE id = ?)',
      [now, contractId]
    );
  }

  /**
   * 获取用户的合同列表
   */
  async getUserContracts(userId: string): Promise<Contract[]> {
    const result = await this.db.execute(
      'SELECT * FROM contracts WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    if (!result.results) {
      return [];
    }

    return result.results.map(row => ({
      id: row.id,
      loanId: row.loan_id,
      userId: row.user_id,
      contractUrl: row.contract_url,
      contractType: row.contract_type,
      language: row.language,
      version: row.version,
      status: row.status,
      signatureData: row.signature_data ? JSON.parse(row.signature_data) : undefined,
      signedAt: row.signed_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}

/**
 * 获取错误消息 (多语言)
 */
export function getContractErrorMessage(code: string, lang: 'en' | 'th'): string {
  const error = ERROR_MESSAGES[code];
  if (!error) {
    return lang === 'en' ? 'Unknown error' : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }
  return lang === 'en' ? error.en : error.th;
}
