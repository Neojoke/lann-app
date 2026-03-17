import { faker } from '@faker-js/faker';
import { z } from 'zod';

// 用户数据工厂
export const testUser = () => ({
  id: faker.string.uuid(),
  username: faker.internet.userName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  nationalId: faker.string.numeric(13),
  dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
  gender: faker.helpers.arrayElement(['male', 'female']),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    province: faker.location.state(),
    postalCode: faker.location.zipCode(),
    country: 'Thailand'
  },
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  isActive: true,
  role: faker.helpers.arrayElement(['customer', 'admin', 'staff'])
});

// 信用数据工厂
export const testCredit = () => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  creditScore: faker.number.int({ min: 300, max: 850 }),
  creditLimit: faker.number.float({ min: 1000, max: 1000000, precision: 0.01 }),
  utilizedAmount: faker.number.float({ min: 0, max: 1000000, precision: 0.01 }),
  availableAmount: faker.number.float({ min: 0, max: 1000000, precision: 0.01 }),
  status: faker.helpers.arrayElement(['pending', 'approved', 'rejected', 'active', 'inactive']),
  applicationDate: faker.date.past(),
  approvedDate: faker.date.past(),
  expirationDate: faker.date.future(),
  creditType: faker.helpers.arrayElement(['personal', 'business', 'student']),
  interestRate: faker.number.float({ min: 0.01, max: 0.25, precision: 0.001 }),
  terms: faker.lorem.paragraph(),
  documents: [
    {
      type: faker.helpers.arrayElement(['id_card', 'income_statement', 'bank_statement']),
      url: faker.internet.url(),
      uploadedAt: faker.date.recent()
    }
  ],
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent()
});

// 借款数据工厂
export const testLoan = () => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  creditId: faker.string.uuid(),
  loanAmount: faker.number.float({ min: 1000, max: 1000000, precision: 0.01 }),
  principalAmount: faker.number.float({ min: 1000, max: 1000000, precision: 0.01 }),
  interestAmount: faker.number.float({ min: 0, max: 100000, precision: 0.01 }),
  totalAmount: faker.number.float({ min: 1000, max: 1100000, precision: 0.01 }),
  interestRate: faker.number.float({ min: 0.01, max: 0.25, precision: 0.001 }),
  term: faker.number.int({ min: 1, max: 36 }),
  termUnit: faker.helpers.arrayElement(['days', 'months']),
  startDate: faker.date.future(),
  endDate: faker.date.future({ years: 3 }),
  status: faker.helpers.arrayElement([
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 
    'disbursed', 'active', 'paid', 'overdue', 'cancelled', 'written_off'
  ]),
  purpose: faker.helpers.arrayElement([
    'personal', 'education', 'medical', 'business', 'home_improvement', 
    'debt_consolidation', 'other'
  ]),
  repaymentSchedule: faker.helpers.arrayElement(['monthly', 'weekly', 'daily', 'lump_sum']),
  collateral: faker.helpers.maybe(() => ({
    type: faker.helpers.arrayElement(['real_estate', 'vehicle', 'equipment', 'other']),
    description: faker.lorem.sentence(),
    estimatedValue: faker.number.float({ min: 10000, max: 5000000, precision: 0.01 }),
    details: faker.lorem.paragraph()
  })),
  guarantor: faker.helpers.maybe(() => ({
    name: faker.person.fullName(),
    relationship: faker.helpers.arrayElement(['spouse', 'parent', 'sibling', 'friend', 'colleague']),
    phone: faker.phone.number(),
    address: faker.location.streetAddress()
  })),
  documents: [
    {
      type: faker.helpers.arrayElement(['loan_agreement', 'promissory_note', 'collateral_agreement']),
      url: faker.internet.url(),
      uploadedAt: faker.date.recent()
    }
  ],
  fees: [
    {
      type: faker.helpers.arrayElement(['origination', 'processing', 'late', 'service']),
      amount: faker.number.float({ min: 0, max: 10000, precision: 0.01 }),
      description: faker.lorem.sentence()
    }
  ],
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  appliedAt: faker.date.past(),
  approvedAt: faker.date.past(),
  disbursedAt: faker.date.past()
});

// 还款数据工厂
export const testRepayment = () => ({
  id: faker.string.uuid(),
  loanId: faker.string.uuid(),
  userId: faker.string.uuid(),
  installmentNumber: faker.number.int({ min: 1, max: 36 }),
  dueDate: faker.date.future({ years: 1 }),
  paidDate: faker.helpers.maybe(() => faker.date.past()),
  principalAmount: faker.number.float({ min: 100, max: 50000, precision: 0.01 }),
  interestAmount: faker.number.float({ min: 1, max: 5000, precision: 0.01 }),
  penaltyAmount: faker.number.float({ min: 0, max: 1000, precision: 0.01 }),
  totalAmount: faker.number.float({ min: 100, max: 55000, precision: 0.01 }),
  paidAmount: faker.number.float({ min: 0, max: 55000, precision: 0.01 }),
  outstandingAmount: faker.number.float({ min: 0, max: 55000, precision: 0.01 }),
  status: faker.helpers.arrayElement([
    'pending', 'paid', 'overdue', 'partial', 'waived', 'cancelled'
  ]),
  paymentMethod: faker.helpers.arrayElement([
    'cash', 'bank_transfer', 'mobile_banking', 'credit_card', 'debit_card', 'check'
  ]),
  referenceNumber: faker.finance.accountNumber(),
  notes: faker.lorem.sentence(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  paidAt: faker.helpers.maybe(() => faker.date.past())
});

// 批量生成函数
export const generateTestUsers = (count: number) => Array.from({ length: count }, testUser);
export const generateTestCredits = (count: number) => Array.from({ length: count }, testCredit);
export const generateTestLoans = (count: number) => Array.from({ length: count }, testLoan);
export const generateTestRepayments = (count: number) => Array.from({ length: count }, testRepayment);

// 生成关联数据的函数
export const generateRelatedTestData = () => {
  const user = testUser();
  const credit = testCredit();
  credit.userId = user.id;
  
  const loan = testLoan();
  loan.userId = user.id;
  loan.creditId = credit.id;
  
  const repayment = testRepayment();
  repayment.loanId = loan.id;
  repayment.userId = user.id;
  
  return {
    user,
    credit,
    loan,
    repayment
  };
};