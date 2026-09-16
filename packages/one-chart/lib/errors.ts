/** 图表数据或配置非法时抛出的错误。 */
export class OneChartDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OneChartDataError';
  }
}

/** 比例尺构造参数非法时抛出的错误。 */
export class OneChartScaleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OneChartScaleError';
  }
}
