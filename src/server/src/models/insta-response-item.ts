import { LocationFeedResponseLocation, LocationFeedResponseMedia, TagFeedResponseItemsItem, UserFeedResponseItemsItem } from 'instagram-private-api';


export interface UserFeedResponseItem extends UserFeedResponseItemsItem {
  location?: LocationFeedResponseLocation;
}

export type InstaResponseItem = UserFeedResponseItem | TagFeedResponseItemsItem | LocationFeedResponseMedia | LocationFeedResponseMedia;
