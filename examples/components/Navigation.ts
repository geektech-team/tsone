import { Component, VNode } from '../../lib';
import { StyleOptions } from '../../lib/style/StyleManager';
import { useRouter } from '../../lib/router/instance';

interface NavLink {
  path: string;
  text: string;
}

interface NavigationProps {
  links?: NavLink[];
  activeClass?: string;
  onNavigate?: (path: string) => void;
}

interface NavigationState {
  links: NavLink[];
  currentPath: string;
}

export class Navigation extends Component<NavigationProps, NavigationState> {
  constructor(protected props: NavigationProps = {}) {
    super(props);
  }

  protected initState(): NavigationState {
    return {
      links: this.props.links ?? [
        { path: '/', text: '首页' },
        { path: '/counter', text: '计数器' },
      ],
      currentPath: window.location.pathname,
    };
  }

  protected initStyles(): void {
    const navStyles: StyleOptions = {
      selector: '.navigation',
      properties: {
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '30px',
      },
    };

    const linkStyles: StyleOptions = {
      selector: '.navigation .nav-link',
      properties: {
        display: 'inline-block',
        padding: '10px 20px',
        color: '#fff',
        backgroundColor: '#42b983',
        borderRadius: '4px',
        textDecoration: 'none',
        transition: 'all 0.3s',
      },
      hover: {
        backgroundColor: '#3aa876',
      },
    };

    const activeLinkStyles: StyleOptions = {
      selector: '.navigation .nav-link.active',
      properties: {
        backgroundColor: '#3aa876',
        transform: 'scale(1.05)',
      },
    };

    this.styleManager.addStyle('navigation', navStyles);
    this.styleManager.addStyle('navLink', linkStyles);
    this.styleManager.addStyle('activeLink', activeLinkStyles);
  }

  private handleNavigation(path: string, e: Event) {
    e.preventDefault();
    this.state.currentPath = path;

    // 调用父组件传入的回调
    if (this.props.onNavigate) {
      this.props.onNavigate(path);
    }

    const router = useRouter();
    router.push(path);
  }

  protected render(): VNode {
    return {
      tag: 'nav',
      props: { class: 'navigation' },
      children: this.state.links.map(
        (link: { path: string; text: string }) => ({
          tag: 'a',
          props: {
            class: `nav-link ${this.state.currentPath === link.path ? 'active' : ''}`,
            href: link.path,
          },
          listeners: {
            click: (e: Event) => this.handleNavigation(link.path, e),
          },
          children: [link.text],
        })
      ),
    };
  }
}
