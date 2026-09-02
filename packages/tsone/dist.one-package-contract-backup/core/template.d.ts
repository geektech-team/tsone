import { ReactiveEffect } from './reactive';
export interface TemplateBinding {
    node: Text;
    originalText: string;
    effect: ReactiveEffect;
}
export declare class TemplateEngine {
    state: object;
    private bindings;
    private readonly templateRegex;
    constructor(state: object);
    /**
     * 解析模板字符串，创建响应式的文本节点
     * @param text 包含模板表达式的文本字符串
     * @returns 创建的文本节点
     */
    parseTemplate(text: string): Text;
    /**
     * 设置响应式绑定
     */
    private setupReactiveBindings;
    /**
     * 计算模板文本的值
     */
    private evaluateTemplate;
    /**
     * 从状态对象中获取值，支持嵌套属性访问
     */
    private getValueFromState;
    /**
     * 清除所有模板绑定
     */
    clearBindings(): void;
    /**
     * 获取当前的绑定数量
     */
    getBindingCount(): number;
    /**
     * 检查模板是否包含表达式
     */
    hasExpressions(text: string): boolean;
    /**
     * 获取模板中的所有表达式键
     */
    extractKeys(text: string): string[];
    /**
     * 计算模板值
     */
    evaluateTemplateValue(text: string): string;
}
