import { Component, type VNode } from '@geektech/tsone';
import {
  OneUpload,
  type OneUploadChangeEvent,
  type OneUploadFile,
} from '../../../lib';
import { pick } from './locale';

interface UploadDemoState {
  files: OneUploadFile[];
}

export class UploadDemo extends Component<
  Record<string, never>,
  UploadDemoState
> {
  private readonly handleChange = (payload: unknown): void => {
    const event = payload as OneUploadChangeEvent;
    this.setState({ files: event.files });
  };

  protected initState(): UploadDemoState {
    return {
      files: [{ id: 'seed-report', name: '设计稿.zip', size: 2480 * 1024 }],
    };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-upload-demo' },
      children: [
        {
          component: OneUpload,
          props: {
            multiple: true,
            accept: 'image/*,.zip,.pdf',
            value: this.state.files,
            ariaLabel: pick('附件', 'Attachments'),
            children: [pick('选择文件', 'Choose files')],
          },
          emitters: { change: this.handleChange },
        },
        {
          component: OneUpload,
          props: {
            defaultValue: [
              { id: 'avatar-seed', name: 'avatar.png', size: 128 * 1024 },
            ],
            accept: 'image/*',
            ariaLabel: pick('头像', 'Avatar'),
            children: [pick('上传头像', 'Upload avatar')],
          },
        },
        {
          tag: 'output',
          props: { 'data-one-upload-result': '' },
          children: [
            pick(
              `已选择 ${this.state.files.length} 个文件`,
              `${this.state.files.length} file(s) selected`
            ),
          ],
        },
      ],
    };
  }
}
