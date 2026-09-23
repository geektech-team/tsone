export type InterceptorHandler<T> = (value: T) => T | Promise<T>;

export class InterceptorManager<T> {
  private readonly handlers = new Set<InterceptorHandler<T>>();

  use(handler: InterceptorHandler<T>): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  async run(value: T): Promise<T> {
    let result = value;
    for (const handler of this.handlers) {
      result = await handler(result);
    }
    return result;
  }
}
