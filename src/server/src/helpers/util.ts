import { Request } from 'express';

export enum TimeUnit {
  MILLISECONDS, SECONDS, MINUTES
}

export class Util {

  public static randomString(length: number): string {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  public static randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  public static randomFrom(array: any[]): any {
    return array[this.randomBetween(0, array.length - 1)]
  }

  public static minutesToMs(minute: number): number {
    return minute * 60 * 1000
  }

  public static getDecimalPlaces(num: number): number {
    return ((num + '').split('.')[1] || []).length
  }

  public static async randomSleep(min: number = 0.5, max: number = 2, unit: TimeUnit = TimeUnit.SECONDS): Promise<void> {

    let randomTime = Util.randomBetween(min, max)

    if (unit === TimeUnit.SECONDS) {
      console.log('Sleeping for', randomTime, 'seconds')
      randomTime = randomTime * 1000
    } else if (unit === TimeUnit.MINUTES) {
      console.log('Sleeping for', randomTime, 'minutes')
      randomTime = randomTime * 60 * 1000;
    } else {
      console.log('Sleeping for', randomTime / 1000, 'ms')
    }

    await new Promise(r => setTimeout(r, randomTime));
  }

  public static getCookies(req: Request): any {
    // We extract the raw cookies from the request headers
    const rawCookies = req.headers?.cookie.split('; ');
    const parsedCookies = {};
    rawCookies.forEach(rawCookie => {
      const [key, value] = rawCookie.split('=');
      parsedCookies[key] = value;
    });
    return parsedCookies;
  };


}

