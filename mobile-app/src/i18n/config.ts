import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 翻译资源
const resources = {
  en: {
    translation: {
      // 首页
      'home.title': 'LANN Thailand Loan',
      'home.welcome': 'Welcome to LANN',
      'home.tagline': 'Thailand Digital Loan Platform',
      'home.register': 'Register',
      'home.registerDesc': 'Create your account to get started',
      'home.loans': 'Loans',
      'home.loansDesc': 'Manage your loans',
      'home.documents': 'Documents',
      'home.documentsDesc': 'Upload documents',
      'home.getStarted': 'Get Started Now',
      'home.login': 'Login',
      
      // 登录页面
      'login.title': 'Login',
      'login.subtitle': 'Easy, Fast, Secure',
      'login.phoneLabel': 'Phone Number',
      'login.phonePlaceholder': '+66',
      'login.otpLabel': 'OTP Code',
      'login.sendOtp': 'Send OTP',
      'login.sendingOtp': 'Sending...',
      'login.resendOtp': 'Resend ({{count}}s)',
      'login.otpSent': 'OTP sent successfully (Test OTP: 123456)',
      'login.login': 'Login',
      'login.loggingIn': 'Logging in...',
      
      // 注册页面
      'register.title': 'Register',
      'register.phoneLabel': 'Phone Number',
      'register.passwordLabel': 'Password',
      'register.confirmPassword': 'Confirm Password',
      'register.register': 'Register',
      'register.registering': 'Registering...',
      
      // 通用
      'loading': 'Loading...',
      'submit': 'Submit',
      'cancel': 'Cancel',
      'back': 'Back',
      'next': 'Next',
      'previous': 'Previous',
      'save': 'Save',
      'edit': 'Edit',
      'delete': 'Delete',
      'confirm': 'Confirm',
      'success': 'Success',
      'error': 'Error',
      'warning': 'Warning',
    },
  },
  th: {
    translation: {
      // 首页
      'home.title': 'LANN เงินกู้ไทย',
      'home.welcome': 'ยินดีต้อนรับสู่ LANN',
      'home.tagline': 'แพลตฟอร์มเงินกู้ดิจิทัลของไทย',
      'home.register': 'ลงทะเบียน',
      'home.registerDesc': 'สร้างบัญชีของคุณเพื่อเริ่มต้น',
      'home.loans': 'เงินกู้',
      'home.loansDesc': 'จัดการเงินกู้ของคุณ',
      'home.documents': 'เอกสาร',
      'home.documentsDesc': 'อัพโหลดเอกสาร',
      'home.getStarted': 'เริ่มต้นเลย',
      'home.login': 'เข้าสู่ระบบ',
      
      // 登录页面
      'login.title': 'เข้าสู่ระบบ',
      'login.subtitle': 'ง่าย รวดเร็ว ปลอดภัย',
      'login.phoneLabel': 'เบอร์โทรศัพท์',
      'login.phonePlaceholder': '+66',
      'login.otpLabel': 'รหัส OTP',
      'login.sendOtp': 'ส่ง OTP',
      'login.sendingOtp': 'กำลังส่ง...',
      'login.resendOtp': 'ส่งใหม่ ({{count}}วิ)',
      'login.otpSent': 'ส่ง OTP สำเร็จ (OTP ทดสอบ: 123456)',
      'login.login': 'เข้าสู่ระบบ',
      'login.loggingIn': 'กำลังเข้าสู่ระบบ...',
      
      // 注册页面
      'register.title': 'ลงทะเบียน',
      'register.phoneLabel': 'เบอร์โทรศัพท์',
      'register.passwordLabel': 'รหัสผ่าน',
      'register.confirmPassword': 'ยืนยันรหัสผ่าน',
      'register.register': 'ลงทะเบียน',
      'register.registering': 'กำลังลงทะเบียน...',
      
      // 通用
      'loading': 'กำลังโหลด...',
      'submit': 'ยืนยัน',
      'cancel': 'ยกเลิก',
      'back': 'ย้อนกลับ',
      'next': 'ถัดไป',
      'previous': 'ก่อนหน้า',
      'save': 'บันทึก',
      'edit': 'แก้ไข',
      'delete': 'ลบ',
      'confirm': 'ยืนยัน',
      'success': 'สำเร็จ',
      'error': 'ข้อผิดพลาด',
      'warning': 'คำเตือน',
    },
  },
};

// 获取保存的语言偏好
const getSavedLanguage = (): string => {
  const saved = localStorage.getItem('preferred_language');
  if (saved && (saved === 'en' || saved === 'th')) {
    return saved;
  }
  // 默认使用泰语
  return 'th';
};

// 初始化 i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(), // 默认语言为泰语
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React 已经处理了 XSS 防护
    },
    react: {
      useSuspense: false,
    },
  });

// 保存语言偏好
export const saveLanguagePreference = (lng: string) => {
  localStorage.setItem('preferred_language', lng);
  i18n.changeLanguage(lng);
};

// 获取当前语言
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

export default i18n;
