import { LocationFeedResponseMedia, TagFeedResponseItemsItem } from 'instagram-private-api';

import { UserFeedResponseItem } from './insta-post';


export type InstaResponseItem = UserFeedResponseItem | TagFeedResponseItemsItem | LocationFeedResponseMedia | LocationFeedResponseMedia;
