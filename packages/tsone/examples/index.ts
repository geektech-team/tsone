import { Component, VNode, createApp } from '../lib';
import { RouterView, createRouter } from '../lib/router';
import { Home } from './components/Home';
import { Counter } from './components/Counter';

class App extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'main',
      children: [{ component: RouterView }],
    };
  }
}

// 创建全局状态
const globalState = {
  appName: 'TSone Framework Demo',
  version: '1.0.0',
  user: {
    name: 'Demo User',
    isLoggedIn: true,
  },
};

// 创建路由实例
const router = createRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { title: '首页' },
    },
    {
      path: '/counter',
      name: 'counter',
      component: Counter,
      meta: { title: '计数器' },
    },
  ],
  mode: 'history',
  base: '/',
});

// 路由变化时更新页面标题
router.onRouteChange((to) => {
  document.title = String(to.meta?.title ?? 'TSone Framework');
});

// 创建应用实例
const app = createApp({
  root: App,
  // 指定挂载点
  rootElement: '#app',
  // 全局状态
  state: globalState,
  // 全局配置
  config: {
    debug: true,
    enableDevTools: true,
  },
});

// 使用路由插件
app.use(router);

// 挂载应用
// 挂载应用
app.mount();
console.log('App mounted!');

// 监听应用卸载
app.onUnmounted(() => {
  console.log('App unmounted!');
});

// 为了演示，导出应用实例
(window as Window & { app?: typeof app }).app = app;
