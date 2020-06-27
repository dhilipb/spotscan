import { LocationFeedResponseMedia, TagFeedResponseItemsItem } from 'instagram-private-api';
import { UserFeedResponseItem } from 'models';

import { Util } from './helpers/util';

const MIN_DECIMAL_PLACES_COORDINATES = 4;
export class InstagramUtil {

  public static isValidImage(image: UserFeedResponseItem | TagFeedResponseItemsItem | LocationFeedResponseMedia): boolean {
    const location = image?.location;
    if (location) {
      return Util.getDecimalPlaces(location.lat) > MIN_DECIMAL_PLACES_COORDINATES && Util.getDecimalPlaces(location.lng) > MIN_DECIMAL_PLACES_COORDINATES;
    }
    return false;
  }

  public static hasHighLikeCount(image: UserFeedResponseItem | TagFeedResponseItemsItem | LocationFeedResponseMedia, count: number = 100): boolean {
    return image.like_count > count;
  }

}
