import { LocationFeedResponseMedia, TagFeedResponseItemsItem, UserFeedResponseItemsItem } from 'instagram-private-api';

import { UserFeedResponseItem } from './user-feed-response';

export type InstaResponseItem = UserFeedResponseItemsItem | UserFeedResponseItem | TagFeedResponseItemsItem | LocationFeedResponseMedia | LocationFeedResponseMedia;
