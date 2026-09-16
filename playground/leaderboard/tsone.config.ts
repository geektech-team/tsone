import { defineConfig } from '@geektech/tsone-cli';

export default defineConfig({
  entry: 'src/main.ts',
  mp: {
    appId: 'touristappid',
    navigationBarTitleText: '数据排行榜',
  },
});
