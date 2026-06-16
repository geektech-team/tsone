import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { FreeApp } from '../../core/app';
import { Component } from '../../core/component';
import { VNode } from '../../core/vnode';
import { resetRouter, useRouter } from '../instance';
import { Router, createRouter } from '../index';

class TestHomeComponent extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  render(): VNode {
    return {
      tag: 'div',
      props: { id: 'home' },
      children: ['Home Page'],
    };
  }
}

class TestAboutComponent extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  render(): VNode {
    return {
      tag: 'div',
      props: { id: 'about' },
      children: ['About Page'],
    };
  }
}

class TestUserComponent extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  render(): VNode {
    return {
      tag: 'div',
      props: { id: 'user' },
      children: ['User Page'],
    };
  }
}

describe('Router', () => {
  let router: Router;
  let app: FreeApp;
  let pushStateSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    resetRouter();
    window.history.replaceState({}, '', '/');
    pushStateSpy?.mockRestore();
    pushStateSpy = spyOn(window.history, 'pushState');

    router = createRouter({
      routes: [
        { path: '/', component: TestHomeComponent },
        { path: '/about', component: TestAboutComponent },
        { path: '/users/:id', component: TestUserComponent, name: 'user' },
      ],
    });
    app = new FreeApp();
  });

  describe('路由实例管理', () => {
    it('未安装时useRouter应该抛出错误', () => {
      expect(() => useRouter()).toThrow('Router is not initialized');
    });

    it('安装后应该可以通过useRouter访问', () => {
      router.install(app);
      expect(useRouter()).toBe(router);
    });
  });

  describe('createRouter', () => {
    it('应该正确创建路由实例', () => {
      expect(router).toBeInstanceOf(Router);
    });

    it('应该包含配置的路由', () => {
      expect(router.getRoutes()).toHaveLength(3);
      expect(router.getRoutes()[0].path).toBe('/');
      expect(router.getRoutes()[1].path).toBe('/about');
      expect(router.getRoutes()[2].path).toBe('/users/:id');
    });

    it('应该兼容README中的数组路由写法', () => {
      const arrayRouter = createRouter([
        { path: '/', component: TestHomeComponent },
      ]);

      expect(arrayRouter.getRoutes()).toHaveLength(1);
    });
  });

  describe('路由导航', () => {
    beforeEach(() => {
      router.install(app);
    });

    it('应该正确处理路由跳转', () => {
      router.push('/about');

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/about');
      expect(router.getCurrentRoute()?.path).toBe('/about');
      expect(router.getCurrentRouteRecord()?.component).toBe(
        TestAboutComponent
      );
    });

    it('路径不存在时应匹配根路由组件但不重写当前URL', () => {
      window.history.replaceState({}, '', '/non-existent');
      router.install(app);

      expect(router.getCurrentRoute()?.path).toBe('/non-existent');
      expect(router.getCurrentRouteRecord()?.component).toBe(TestHomeComponent);
      expect(pushStateSpy).not.toHaveBeenCalledWith({}, '', '/');
    });

    it('应该允许取消路由变化监听', () => {
      const listener = mock();
      const unsubscribe = router.onRouteChange(listener);

      router.push('/about');
      unsubscribe();
      router.push('/');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('应该匹配动态路径并填充params', () => {
      router.push('/users/42?tab=profile');

      expect(router.getCurrentRouteRecord()?.component).toBe(TestUserComponent);
      expect(router.getCurrentRoute()).toMatchObject({
        path: '/users/42',
        name: 'user',
        params: { id: '42' },
        query: { tab: 'profile' },
      });
    });
  });
});
