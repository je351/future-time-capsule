import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'future-timecapsule',
  brand: {
    displayName: '퓨쳐타임캡슐',
    primaryColor: '#8B5CF6',
    icon: 'https://static.toss.im/appsintoss/35001/2b5b1fa2-a216-473f-9996-db1b884f5c93.png', // 앱인토스 콘솔 → 앱 정보 → 아이콘 이미지 우클릭 → 링크 복사 후 넣어주세요
  },
  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'vite --port=3000 --host=0.0.0.0',
      build: 'vite build',
    },
  },
  permissions: [
    {
      name: 'clipboard',
      access: 'write',
    },
  ],
  outdir: 'dist',
  webViewProps: {
    type: 'partner', // 비게임 네비게이션 바
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
});
