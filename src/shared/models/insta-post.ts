import { LocationFeedResponseLocation, LocationFeedResponseMedia, TagFeedResponseItemsItem, UserFeedResponseItemsItem } from 'instagram-private-api';


export interface UserFeedResponseItem extends UserFeedResponseItemsItem {
  location?: LocationFeedResponseLocation;
}

export interface ImageCandidate {
  width?: number;
  height?: number;
  url?: string;
  scans_profile?: string;
  estimated_scans_sizes?: number[];
}

export interface ImageVersions {
  candidates?: ImageCandidate[];
}

export interface Location {
  pk?: number;
  name?: string;
  address?: string;
  city?: string;
  short_name?: string;
  lng?: string;
  lat?: number;
  external_source?: string;
  facebook_places_id?: number;
}

export interface InstaUser {
  pk?: number;
  username?: string;
  full_name?: string;
  is_private?: boolean;
  profile_pic_url?: string;
  profile_pic_id?: string;
  is_verified?: boolean;
  has_anonymous_profile_picture?: boolean;
  is_unpublished?: boolean;
  is_favorite?: boolean;
  latest_reel_media?: number;
}

export interface PreviewComment {
  pk?: string;
  user_id?: number;
  text?: string;
  type?: number;
  created_at?: number;
  created_at_utc?: number;
  content_type?: string;
  status?: string;
  bit_flags?: number;
  did_report_as_spam?: boolean;
  share_enabled?: boolean;
  user?: InstaUser;
  media_id?: string;
  has_liked_comment?: boolean;
  comment_like_count?: number;
}

export interface Caption {
  pk?: string;
  user_id?: number;
  text?: string;
  type?: number;
  created_at?: number;
  created_at_utc?: number;
  content_type?: string;
  status?: string;
  bit_flags?: number;
  did_report_as_spam?: boolean;
  share_enabled?: boolean;
  user?: InstaUser;
  media_id?: string;
}

export interface InstaPost {
  taken_at?: number;
  pk?: string;
  id?: string;
  device_timestamp?: string | number;
  media_type?: number;
  code?: string;
  client_cache_key?: string;
  filter_type?: number;
  image_versions2?: ImageVersions;
  original_width?: number;
  original_height?: number;
  location?: SimpleLocation;
  user?: InstaUser;
  can_viewer_reshare?: boolean;
  caption_is_edited?: boolean;
  comment_likes_enabled?: boolean;
  comment_threading_enabled?: boolean;
  has_more_comments?: boolean;
  next_max_id?: string;
  max_num_visible_preview_comments?: number;
  preview_comments?: PreviewComment[];
  can_view_more_preview_comments?: boolean;
  comment_count?: number;
  inline_composer_display_condition?: string;
  inline_composer_imp_trigger_time?: number;
  like_count?: number;
  has_liked?: boolean;
  top_likers?: any[];
  photo_of_you?: boolean;
  can_see_insights_as_brand?: boolean;
  caption?: Caption;
  can_viewer_save?: boolean;
  organic_tracking_token?: string;
  [key: string]: any;
}

export interface SimpleLocation {
  // geohash?: string;
  // geopoint?: GeoPoint;
  lat?: number;
  lng?: number;
  [latLng: string]: number;
}

export interface GeoPoint {
  _latitude: number;
  _longitude: number;
}

export type InstaResponseItem = UserFeedResponseItem | TagFeedResponseItemsItem | LocationFeedResponseMedia | LocationFeedResponseMedia;