import * as crypto from 'crypto';

export class Util {
	public static randomBetween(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	public static randomFrom(array) {
		return array[this.randomBetween(0, array.length - 1)];
	}

	public static minutesToMs(minute) {
		return minute * 60 * 1000;
	}

	public static hash(stringToHash) {
		return crypto.createHash('md5').update(stringToHash).digest('hex');
	}

	public static getDecimalPlaces(num) {
		return ((num + "").split(".")[1] || []).length;
	}

};

