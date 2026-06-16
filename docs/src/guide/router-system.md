# 路由系统

TSone 内置了路由系统，它允许您创建单页应用（SPA），通过不同的 URL 路径显示不同的内容。本文档将详细介绍路由系统的使用方法和配置选项。

## 核心概念

### 路由实例

路由实例是通过 `createRouter` 函数创建的对象，它负责管理应用的路由配置和导航逻辑。

### 路由配置

路由配置是一个包含路由规则的数组，每个路由规则定义了一个 URL 路径与组件的映射关系。

### 路由导航

路由导航是指在不同路由之间切换的过程，您可以通过编程方式或使用链接进行导航。

## 基本使用

### 安装路由

在 TSone 中，路由系统是内置的，您可以直接从 `tsone/router` 导入：

```typescript
import { createRouter } from 'tsone/router';
```

### 创建路由实例

```typescript
import { createApp } from 'tsone';
import { createRouter } from 'tsone/router';
import { HomeComponent } from './components/HomeComponent';
import { AboutComponent } from './components/AboutComponent';
import { UserComponent } from './components/UserComponent';

// 创建路由实例
const router = createRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeComponent,
      meta: { title: '首页' }
    },
    {
      path: '/about',
      name: 'about',
      component: AboutComponent,
      meta: { title: '关于我们' }
    },
    {
      path: '/user/:id',
      name: 'user',
      component: UserComponent,
      meta: { title: '用户详情' }
    }
  ],
  mode: 'history',
  base: '/'
});

// 创建应用实例
const app = createApp({
  rootElement: '#app'
});

// 使用路由插件
app.use(router);

// 挂载应用
app.mount();
```

## 路由配置选项

### 路由规则

每个路由规则可以包含以下选项：

- `path`: URL 路径模式
- `name`: 路由名称（可选）
- `component`: 对应的组件
- `meta`: 元数据（可选）
- `redirect`: 重定向目标（可选）

### 路径模式

路径模式支持以下特性：

#### 静态路径

```typescript
{
  path: '/about',
  component: AboutComponent
}
```

#### 动态路径参数

```typescript
{
  path: '/user/:id',
  component: UserComponent
}
```

#### 通配符

```typescript
{
  path: '*',
  component: NotFoundComponent
}
```

## 路由导航

### 编程式导航

您可以通过路由实例的方法进行编程式导航：

```typescript
// 导入路由实例
import { router } from './router';

// 导航到指定路径
router.push('/about');

// 使用命名路由
router.push({ name: 'user', params: { id: 123 } });

// 替换当前历史记录
router.replace('/about');

// 导航回退
router.back();

// 导航前进
router.forward();

// 导航到指定历史记录位置
router.go(-1); // 回退一步
router.go(1);  // 前进一步
```

### 声明式导航

您可以在组件的 `render` 方法中使用链接进行导航：

```typescript
protected render() {
  return {
    tag: 'div',
    children: [
      {
        tag: 'a',
        props: { href: '/' },
        listeners: {
          click: (e: Event) => {
            e.preventDefault();
            this.router.push('/');
          }
        },
        children: ['首页']
      },
      {
        tag: 'a',
        props: { href: '/about' },
        listeners: {
          click: (e: Event) => {
            e.preventDefault();
            this.router.push('/about');
          }
        },
        children: ['关于我们']
      }
    ]
  };
}
```

## 路由参数

### 获取路由参数

在组件中，您可以通过 `this.router` 获取路由实例，并通过 `this.router.currentRoute` 获取当前路由信息：

```typescript
class UserComponent extends Component {
  protected initState() {
    return {
      userId: '',
      userData: null
    };
  }

  protected onMounted() {
    // 获取路由参数
    const userId = this.router.currentRoute.params.id;
    this.state.userId = userId;
    
    // 根据用户ID获取用户数据
    this.fetchUserData(userId);
  }

  protected fetchUserData(id: string) {
    // 模拟API请求
    setTimeout(() => {
      this.state.userData = {
        id,
        name: `User ${id}`,
        email: `user${id}@example.com`
      };
    }, 500);
  }

  protected render() {
    return {
      tag: 'div',
      children: [
        { tag: 'h1', children: [`用户详情 ${this.state.userId}`] },
        this.state.userData ? (
          {
            tag: 'div',
            children: [
              { tag: 'p', children: [`姓名: ${this.state.userData.name}`] },
              { tag: 'p', children: [`邮箱: ${this.state.userData.email}`] }
            ]
          }
        ) : (
          { tag: 'p', children: ['加载中...'] }
        )
      ]
    };
  }
}
```

### 路由参数变化监听

当路由参数发生变化时（例如从 `/user/1` 导航到 `/user/2`），组件不会重新挂载，但您可以监听路由变化来更新数据：

```typescript
class UserComponent extends Component {
  protected initState() {
    return {
      userId: '',
      userData: null
    };
  }

  protected onMounted() {
    // 初始加载数据
    this.loadUserData();
    
    // 监听路由变化
    this.router.onRouteChange(() => {
      this.loadUserData();
    });
  }

  protected loadUserData() {
    const userId = this.router.currentRoute.params.id;
    this.state.userId = userId;
    
    // 模拟API请求
    setTimeout(() => {
      this.state.userData = {
        id: userId,
        name: `User ${userId}`,
        email: `user${userId}@example.com`
      };
    }, 500);
  }

  // 渲染方法...
}
```

## 路由元数据

您可以在路由配置中添加 `meta` 字段，用于存储额外的路由信息：

```typescript
const router = createRouter({
  routes: [
    {
      path: '/',
      component: HomeComponent,
      meta: {
        title: '首页',
        requiresAuth: false
      }
    },
    {
      path: '/dashboard',
      component: DashboardComponent,
      meta: {
        title: '仪表盘',
        requiresAuth: true
      }
    }
  ]
});
```

然后，您可以在路由导航守卫中使用这些元数据：

```typescript
// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 更新页面标题
  document.title = to.meta?.title || 'TSone App';
  
  // 检查权限
  if (to.meta?.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});
```

## 路由守卫

路由守卫允许您在路由导航过程中执行逻辑，例如权限检查、数据预加载等。

### 全局守卫

```typescript
// 全局前置守卫
router.beforeEach((to, from, next) => {
  console.log('Before navigation:', from.path, '->', to.path);
  // 必须调用 next() 才能继续导航
  next();
});

// 全局后置守卫
router.afterEach((to, from) => {
  console.log('After navigation:', from.path, '->', to.path);
});
```

### 路由独享守卫

```typescript
const router = createRouter({
  routes: [
    {
      path: '/dashboard',
      component: DashboardComponent,
      beforeEnter: (to, from, next) => {
        // 路由独享的守卫
        if (!isAuthenticated()) {
          next('/login');
        } else {
          next();
        }
      }
    }
  ]
});
```

### 组件内守卫

```typescript
class UserComponent extends Component {
  // 组件内守卫
  beforeRouteEnter(to, from, next) {
    // 此时组件实例还未创建
    console.log('Before route enter');
    next();
  }

  beforeRouteUpdate(to, from, next) {
    // 路由参数变化时调用
    console.log('Before route update');
    next();
  }

  beforeRouteLeave(to, from, next) {
    // 离开路由时调用
    console.log('Before route leave');
    next();
  }

  // 其他方法...
}
```

## 路由模式

TSone 路由支持两种模式：

### History 模式

```typescript
const router = createRouter({
  mode: 'history',
  routes: [...] 
});
```

History 模式使用 HTML5 History API 来管理路由，URL 更加简洁美观，但需要服务器配置支持。

### Hash 模式

```typescript
const router = createRouter({
  mode: 'hash',
  routes: [...] 
});
```

Hash 模式使用 URL 哈希（#）来管理路由，不需要服务器配置，但 URL 中会包含哈希部分。

## 嵌套路由

TSone 支持嵌套路由，您可以在路由配置中使用 `children` 选项：

```typescript
const router = createRouter({
  routes: [
    {
      path: '/dashboard',
      component: DashboardComponent,
      children: [
        {
          path: '',
          redirect: 'overview'
        },
        {
          path: 'overview',
          component: OverviewComponent
        },
        {
          path: 'settings',
          component: SettingsComponent
        }
      ]
    }
  ]
});
```

然后，在父组件中使用 `<router-view>` 来显示子路由：

```typescript
class DashboardComponent extends Component {
  protected render() {
    return {
      tag: 'div',
      children: [
        {
          tag: 'h1',
          children: ['仪表盘']
        },
        {
          tag: 'nav',
          children: [
            {
              tag: 'a',
              props: { href: '/dashboard/overview' },
              listeners: {
                click: (e: Event) => {
                  e.preventDefault();
                  this.router.push('/dashboard/overview');
                }
              },
              children: ['概览']
            },
            {
              tag: 'a',
              props: { href: '/dashboard/settings' },
              listeners: {
                click: (e: Event) => {
                  e.preventDefault();
                  this.router.push('/dashboard/settings');
                }
              },
              children: ['设置']
            }
          ]
        },
        {
          tag: 'div',
          props: { className: 'content' },
          children: [
            // 子路由内容会显示在这里
            { tag: 'router-view' }
          ]
        }
      ]
    };
  }
}
```

## 路由 API

### 路由实例方法

- `push(location)`: 导航到指定位置
- `replace(location)`: 替换当前历史记录
- `back()`: 导航回退
- `forward()`: 导航前进
- `go(n)`: 导航到指定历史记录位置
- `beforeEach(guard)`: 添加全局前置守卫
- `afterEach(guard)`: 添加全局后置守卫
- `onRouteChange(callback)`: 监听路由变化

### 路由对象属性

- `currentRoute`: 当前路由信息
- `routes`: 路由配置
- `mode`: 路由模式
- `base`: 基础路径

## 最佳实践

### 路由组织

1. **集中管理路由**：将路由配置集中在一个文件中
2. **使用命名路由**：为路由指定名称，方便导航
3. **合理使用路由参数**：对于动态路径，使用路由参数

### 性能优化

1. **懒加载组件**：对于大型应用，考虑使用动态导入懒加载组件
2. **合理使用路由守卫**：避免在路由守卫中执行昂贵操作
3. **使用 meta 字段**：存储路由相关的元数据

### 常见问题

1. **页面刷新 404**：在 History 模式下，需要服务器配置支持

   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

2. **路由参数变化不更新**：需要监听路由变化来更新数据

3. **嵌套路由不显示**：需要在父组件中添加 `<router-view>`

## 总结

TSone 的路由系统提供了一种简洁、灵活的方式来管理应用的导航和页面切换。通过理解和掌握路由系统的使用方法，您可以创建更加复杂、功能丰富的单页应用。

如果您想了解更多关于路由系统的细节，请参考 [API 参考](/api/router.md) 文档。
