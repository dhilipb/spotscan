// tslint:disable:no-console

export class Logger {
  private user: string = '';
  private app: string = '';

  constructor(clazz: any) {
    if (clazz?.constructor) {
      this.app = clazz.constructor?.name;
      this.user = clazz.instagramClient?.username || clazz.instagram?.username || '';
    }

    this.app = this.app ? `[${this.app}]` : '';
  }

  setUser(user: string): void {
    this.user = user ? `[${user}]` : '';
  }

  log(...messages: any[]): any {
    const timestamp = new Date().toISOString().slice(0, -1);
    console.log(`${timestamp} ${this.app}${this.user}:`, ...messages);
  }

  error(...messages: any[]): any {
    const timestamp = new Date().toISOString().slice(0, -1);
    console.error(`${timestamp} ${this.app}${this.user}: ERROR`, ...messages);
  }
}
