/// <reference types="react-scripts" />

// 定义 Service Worker 类型
declare global {
  interface Window {
    // 注册 PWA Service Worker
    serviceWorker?: ServiceWorkerContainer;
  }

  interface Navigator {
    // 用于后台同步
    serviceWorker?: ServiceWorkerContainer;
  }
}

// PWA 相关接口定义
interface ServiceWorkerRegistration {
  readonly sync: SyncManager;
}

interface SyncManager {
  register(tag: string): Promise<void>;
}

interface PushSubscription {
  toJSON(): any;
}

export {};

// React 组件类型定义
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}