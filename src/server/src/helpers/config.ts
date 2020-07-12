import { get, has, isBoolean, isNumber, isString, set, toNumber } from 'lodash';

import { Logger } from './logger';

const logger = new Logger('Config');

export const Config = {
  whatIfMode: false,

  Instagram: {
    DeleteCookies: false
  },

  Firebase: {
    Url: 'https://instamap-47a8a.firebaseio.com/'
  }
};

/**
 * Update Config above with items from process.env.
 * 
 * Example: INSTAGRAM.DELETECOOKIES: true
 */
function updateConfig(config: any, prefix: string = ''): void {
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === typeof {}) {
      updateConfig(value, key + '.');
    } else {
      const processKey = prefix.toUpperCase() + key.toUpperCase();
      const processValue = get(process.env, processKey);

      if (has(process.env, processKey)) {
        const configKey = prefix + key;
        const configValue = get(Config, configKey);

        // Set value
        let valueToSet = null;
        if (isNumber(configValue)) {
          // logger.log(configKey, 'is number');
          valueToSet = toNumber(processValue);
        } else if (isBoolean(configValue)) {
          // logger.log(configKey, 'is boolean');
          valueToSet = processValue === 'true';
        } else if (isString(configValue)) {
          // logger.log(configKey, 'is string');
          valueToSet = String(processValue);
        }

        if (valueToSet !== null) {
          logger.log(`Updating config param configKey: ${configKey}, defaultValue: ${configValue}, processValue: ${valueToSet}`);
          set(Config, configKey, valueToSet);
        }
      }
    }
  }
}

updateConfig(Config);

