// Service Worker for PWA functionality
const CACHE_NAME = 'lann-loan-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icon/icon.png',
  '/assets/icon/favicon.png',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');

  // 缓存关键资源
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opening cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果找到缓存，直接返回
        if (response) {
          return response;
        }

        // 克隆请求，因为请求对象只能被使用一次
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // 检查响应是否有效
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应，因为响应对象只能被使用一次
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// 更新 Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');

  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 后台同步事件
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// 推送通知事件
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Default notification body',
    icon: '/assets/icon/icon.png',
    badge: '/assets/icon/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Lann Loan App', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/notifications')
  );
});

// 后台同步函数
async function syncData() {
  try {
    // 在这里实现后台数据同步逻辑
    console.log('Syncing data in the background...');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}