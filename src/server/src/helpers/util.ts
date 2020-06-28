export class Util {
  public static randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  public static randomFrom(array: any[]): any {
    return array[this.randomBetween(0, array.length - 1)];
  }

  public static minutesToMs(minute: number): number {
    return minute * 60 * 1000;
  }

  public static getDecimalPlaces(num: number): number {
    return ((num + '').split('.')[1] || []).length;
  }

}
