import * as fs from 'fs';
import { get, has, isBoolean, isNumber, isString, set, toNumber } from 'lodash';
import * as path from 'path';
import { injectable } from 'tsyringe';

import { Logger } from './logger';

export const Config = {
  whatIfMode: false,

  Production: false,

  Admin: {
    DeletePass: 'aa123' //Util.randomString(5)
  },

  Instagram: {
    Scrape: {
      Users: false,
      Tags: false,
      Locations: false
    },
    ImageChecker: false,
    DeleteCookies: false
  },

  MongoDb: {
    Credentials: 'mongodb://username:password@infitech.in:27017/spotscan?authSource=admin',
    IsReplicaSet: false
  },

  Firebase: {
    Url: 'https://instamap-47a8a.firebaseio.com/'
  },

  Imgur: {
    ClientId: '43652b743b5a7a0'
  }
};


@injectable()
export class ConfigUpdater {
  private readonly logger: Logger = new Logger(this)

  private readonly CONFIG_SEPARATOR = '.';

  public initConfig() {
    this.logger.log('Initialising Config');

    const configSecretFile = path.join(process.cwd(), 'secret', 'config.json');
    if (fs.existsSync(configSecretFile)) {
      const configFile = JSON.parse(fs.readFileSync(configSecretFile).toString());
      Object.entries(configFile).forEach(([key, value]) => {
        this.logger.log('Updating from file', key);
        process.env[key] = value.toString();
      })
    }

    this.updateConfig(Config);
  }

  /**
   * Update Config above with items from process.env.
   * 
   * Example: INSTAGRAM.DELETECOOKIES: true
   */
  private updateConfig(config: any, prefix: string = ''): void {
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === typeof {}) {
        this.updateConfig(value, prefix + key + this.CONFIG_SEPARATOR);
      } else {
        const processKey = prefix.toUpperCase() + key.toUpperCase();
        const processValue = get(process.env, processKey);


        if (has(process.env, processKey)) {
          const configKey = prefix + key;
          const configValue = get(Config, configKey);

          // Set value
          let valueToSet = null;
          if (isNumber(configValue)) {
            // this.logger.log(configKey, 'is number');
            valueToSet = toNumber(processValue);
          } else if (isBoolean(configValue)) {
            // this.logger.log(configKey, 'is boolean');
            valueToSet = processValue === 'true';
          } else if (isString(configValue)) {
            // this.logger.log(configKey, 'is string');
            valueToSet = String(processValue);
          }

          if (valueToSet !== null) {
            this.logger.log(`Updating config param configKey: ${configKey}, defaultValue: ${configValue}, envValue: ${valueToSet}`);
            set(Config, configKey, valueToSet);
          }
        }
      }
    }
  }
}