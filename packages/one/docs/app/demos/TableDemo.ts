import { Component, type VNode } from '@geektech/tsone';
import { OneTag, OneTable, type OneDataDisplayVariant } from '../../../lib';
import { pick } from './locale';

interface MemberRow {
  name: string;
  role: string;
  status: string;
}

function statusVariant(status: string): OneDataDisplayVariant {
  if (status === pick('在线', 'Online')) return 'success';
  if (status === pick('忙碌', 'Busy')) return 'warning';
  return 'neutral';
}

const members: readonly MemberRow[] = [
  {
    name: pick('林晚', 'Eve Lin'),
    role: pick('设计', 'Design'),
    status: pick('在线', 'Online'),
  },
  {
    name: pick('苏北', 'Ben Su'),
    role: pick('前端', 'Frontend'),
    status: pick('忙碌', 'Busy'),
  },
  {
    name: pick('周航', 'Hank Zhou'),
    role: pick('后端', 'Backend'),
    status: pick('离线', 'Offline'),
  },
  {
    name: pick('陈一', 'Echo Chen'),
    role: pick('测试', 'QA'),
    status: pick('在线', 'Online'),
  },
];

export class TableDemo extends Component<Record<string, never>, object> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-table-demo' },
      children: [
        {
          component: OneTable,
          props: {
            data: members,
            rowKey: 'name',
            hover: true,
            striped: true,
            ariaLabel: pick('团队成员', 'Team members'),
            columns: [
              { key: 'name', title: pick('姓名', 'Name') },
              { key: 'role', title: pick('角色', 'Role') },
              {
                key: 'status',
                title: pick('状态', 'Status'),
                render: (row: MemberRow) => ({
                  component: OneTag,
                  props: { variant: statusVariant(row.status) },
                  children: [row.status],
                }),
              },
            ],
          },
        },
      ],
    };
  }
}
