export class ByteProgressBar {
  private static readonly START_CHAR = '[';
  private static readonly END_CHAR = ']';
  private static readonly FILL_CHAR = '=';

  private readonly bar: string[];
  private readonly barContentLength: number;

  constructor(barContentLength: number) {
    this.bar = Array<string>(barContentLength + 2);
    this.barContentLength = barContentLength;

    this.bar[0] = ByteProgressBar.START_CHAR;
    this.bar[this.bar.length] = ByteProgressBar.END_CHAR;
    this.bar.fill(' ', 1, this.barContentLength + 1);
  }

  display(curr: number, total: number): void {
    const rate = curr / total;
    const percentage = Math.floor(rate * 100);
    const progressBarRate = Math.floor(rate * this.barContentLength);

    this.bar.fill(ByteProgressBar.FILL_CHAR, 1, progressBarRate + 1);

    process.stdout.write(
      `\r${this.bar.join('')} ${curr} / ${total} bytes (${percentage}%) `
    );

    if (curr === total) {
      process.stdout.write('\n');
    }
  }
}
