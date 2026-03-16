import dayjs from 'dayjs';
import 'dayjs/locale/th';
import 'dayjs/locale/en';
import i18n from '../i18n/config';

/**
 * 格式化日期为本地化格式
 * @param date 日期字符串或 Date 对象
 * @param format 格式模板，默认 'DD/MM/YYYY'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | Date, format: string = 'DD/MM/YYYY'): string => {
  const currentLang = i18n.language || 'th';
  
  // 设置 dayjs 的语言
  dayjs.locale(currentLang === 'th' ? 'th' : 'en');
  
  const dateObj = dayjs(date);
  
  // 泰语使用佛历年份
  if (currentLang === 'th') {
    const buddhistYear = dateObj.year() + 543;
    const formatted = dateObj.format(format.replace('YYYY', 'BBBB'));
    return formatted.replace('BBBB', buddhistYear.toString());
  }
  
  return dateObj.format(format);
};

/**
 * 格式化日期时间为本地化格式
 * @param date 日期字符串或 Date 对象
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'DD/MM/YYYY HH:mm');
};

/**
 * 格式化相对时间（如：3 天前）
 * @param date 日期字符串或 Date 对象
 * @returns 相对时间字符串
 */
export const formatRelativeTime = (date: string | Date): string => {
  const currentLang = i18n.language || 'th';
  dayjs.locale(currentLang === 'th' ? 'th' : 'en');
  
  const dateObj = dayjs(date);
  const now = dayjs();
  const diffDays = now.diff(dateObj, 'day');
  
  if (diffDays === 0) {
    return currentLang === 'th' ? 'วันนี้' : 'Today';
  } else if (diffDays === 1) {
    return currentLang === 'th' ? 'เมื่อวาน' : 'Yesterday';
  } else if (diffDays < 7) {
    return currentLang === 'th' 
      ? `${diffDays} วันที่แล้ว` 
      : `${diffDays} days ago`;
  } else {
    return formatDate(date);
  }
};

/**
 * 格式化到期日倒计时
 * @param dueDate 到期日期
 * @returns 倒计时字符串
 */
export const formatCountdown = (dueDate: string | Date): string => {
  const currentLang = i18n.language || 'th';
  const now = dayjs();
  const due = dayjs(dueDate);
  const diffDays = due.diff(now, 'day');
  
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return currentLang === 'th'
      ? `เกินกำหนด ${overdueDays} วัน`
      : `Overdue by ${overdueDays} days`;
  } else if (diffDays === 0) {
    return currentLang === 'th' ? 'ครบกำหนดวันนี้' : 'Due today';
  } else if (diffDays === 1) {
    return currentLang === 'th' ? 'ครบกำหนดพรุ่งนี้' : 'Due tomorrow';
  } else {
    return currentLang === 'th'
      ? `ครบกำหนดใน ${diffDays} วัน`
      : `Due in ${diffDays} days`;
  }
};

/**
 * 获取当前语言
 * @returns 当前语言代码
 */
export const getCurrentLanguage = (): string => {
  return i18n.language || 'th';
};

/**
 * 切换语言
 * @param lng 目标语言代码
 */
export const changeLanguage = (lng: 'th' | 'en'): void => {
  i18n.changeLanguage(lng);
  localStorage.setItem('preferred_language', lng);
  dayjs.locale(lng === 'th' ? 'th' : 'en');
};

// 初始化语言
const savedLang = localStorage.getItem('preferred_language') as 'th' | 'en' | null;
if (savedLang) {
  i18n.changeLanguage(savedLang);
  dayjs.locale(savedLang === 'th' ? 'th' : 'en');
}
