import { getCurrentLanguage } from '../i18n/config';

/**
 * 获取包含语言信息的请求头
 */
export const getLanguageHeaders = (): HeadersInit => {
  const lng = getCurrentLanguage();
  return {
    'Accept-Language': lng,
  };
};

/**
 * 合并请求头，添加语言信息
 */
export const mergeHeaders = (customHeaders?: HeadersInit): HeadersInit => {
  const languageHeaders = getLanguageHeaders();
  
  if (!customHeaders) {
    return languageHeaders;
  }
  
  if (customHeaders instanceof Headers) {
    const merged = new Headers(customHeaders);
    merged.set('Accept-Language', languageHeaders['Accept-Language']);
    return merged;
  }
  
  if (Array.isArray(customHeaders)) {
    return [...customHeaders, ['Accept-Language', languageHeaders['Accept-Language']]];
  }
  
  return {
    ...customHeaders,
    ...languageHeaders,
  };
};
