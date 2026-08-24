import {
  Button,
  Component,
  Div,
  Input,
  P,
  VNode,
  createForm,
  each,
  minLength,
  required,
  type InjectionKey,
} from '../../lib';
import type { StyleOptions } from '../../lib/style/StyleManager';

const THEME_KEY = 'example-theme' as InjectionKey<string>;

interface Task {
  id: number;
  label: string;
  done: boolean;
}

interface TaskRowProps {
  task: Task;
}

class TaskRow extends Component<TaskRowProps, object> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'li',
      props: { className: this.props.task.done ? 'task done' : 'task' },
      children: [
        this.props.task.label,
        Button({
          props: { type: 'button' },
          listeners: {
            click: () => this.emit('toggle', this.props.task.id),
          },
          children: [this.props.task.done ? '恢复' : '完成'],
        }),
      ],
    };
  }
}

class ThemeBadge extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return P({
      props: { className: 'feature-theme' },
      children: [`当前注入主题：${this.inject(THEME_KEY, 'default')}`],
    });
  }
}

interface FeaturePlaygroundState {
  showTasks: boolean;
  tasks: Task[];
  profile: {
    name: string;
    role: string;
    subscribed: boolean;
  };
  formErrors: Record<string, string[]>;
  formStatus: string;
}

export class FeaturePlayground extends Component<
  Record<string, never>,
  FeaturePlaygroundState
> {
  protected initState(): FeaturePlaygroundState {
    return {
      showTasks: true,
      tasks: [
        { id: 1, label: '学习 each 列表渲染', done: false },
        { id: 2, label: '尝试组件事件', done: false },
      ],
      profile: { name: '', role: 'developer', subscribed: false },
      formErrors: {},
      formStatus: '填写资料后点击校验',
    };
  }

  protected initStyles(): void {
    const styles: StyleOptions = {
      selector: '.feature-playground',
      properties: {
        marginTop: '32px',
        padding: '20px',
        border: '1px solid #d9e2ec',
        borderRadius: '8px',
        backgroundColor: '#f8fbff',
        textAlign: 'left',
      },
    };
    this.styleManager.addStyle('playground', styles);
  }

  protected beforeMount(): void {
    this.provide(THEME_KEY, 'ocean');
  }

  private toggleTask(id: number): void {
    this.state.tasks = this.state.tasks.map((task) =>
      task.id === id ? { ...task, done: !task.done } : task
    );
  }

  private addTask(): void {
    const id = Math.max(0, ...this.state.tasks.map((task) => task.id)) + 1;
    this.state.tasks = [
      ...this.state.tasks,
      { id, label: `新任务 #${id}`, done: false },
    ];
  }

  private validateProfile(): void {
    const form = createForm(this.state.profile, {
      name: [required('请输入姓名'), minLength(2, '姓名至少 2 个字符')],
    });
    const result = form.validate();
    this.state.formErrors = result.errors;
    this.state.formStatus = result.valid ? '校验通过' : '请修正表单错误';
  }

  protected render(): VNode {
    const nameError = this.state.formErrors.name?.[0] ?? '';

    return Div({
      props: { className: 'feature-playground' },
      children: [
        { tag: 'h2', children: ['新特性演练场'] },
        { component: ThemeBadge },
        Button({
          props: { type: 'button' },
          listeners: {
            click: () => (this.state.showTasks = !this.state.showTasks),
          },
          children: [this.state.showTasks ? '隐藏任务' : '显示任务'],
        }),
        {
          tag: 'section',
          directions: { if: this.state.showTasks },
          children: [
            { tag: 'h3', children: ['条件渲染、each 与组件事件'] },
            Button({
              props: { type: 'button' },
              listeners: { click: () => this.addTask() },
              children: ['新增任务'],
            }),
            {
              tag: 'ul',
              children: each(
                this.state.tasks,
                (task) => ({
                  component: TaskRow,
                  props: { task },
                  emitters: { toggle: (id) => this.toggleTask(id as number) },
                }),
                (task) => task.id
              ),
            },
          ],
        },
        {
          tag: 'section',
          children: [
            { tag: 'h3', children: ['表单校验'] },
            {
              tag: 'label',
              children: [
                '姓名',
                Input({ directions: { model: 'profile.name' } }),
              ],
            },
            {
              tag: 'label',
              children: [
                '角色',
                {
                  tag: 'select',
                  directions: { model: 'profile.role' },
                  children: [
                    {
                      tag: 'option',
                      props: { value: 'developer' },
                      children: ['开发者'],
                    },
                    {
                      tag: 'option',
                      props: { value: 'designer' },
                      children: ['设计师'],
                    },
                  ],
                },
              ],
            },
            {
              tag: 'label',
              children: [
                Input({
                  props: { type: 'checkbox' },
                  directions: { model: 'profile.subscribed' },
                }),
                '订阅更新',
              ],
            },
            Button({
              props: { type: 'button' },
              listeners: { click: () => this.validateProfile() },
              children: ['校验资料'],
            }),
            P({ children: [this.state.formStatus] }),
            P({
              directions: { if: Boolean(nameError) },
              children: [nameError],
            }),
          ],
        },
      ],
    });
  }
}
