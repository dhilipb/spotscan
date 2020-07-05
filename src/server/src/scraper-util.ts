import { getModelForClass } from '@typegoose/typegoose';
import { LocationFeedResponseMedia, TagFeedResponseItemsItem } from 'instagram-private-api';
import { get, has } from 'lodash';
import { injectable } from 'tsyringe';

import { InstaPost, InstaResponseItem, UserFeedResponseItem } from '../../shared/models/insta-post';
import { InstagramClient, Logger } from './helpers';
import { GeoFireUtil } from './helpers/geofire.util';
import { InstagramUtil } from './instagram-util';
import { ScrapedHashtagDto, ScrapedLocationDto, ScrapedPostDto, ScrapedUserDto } from './models/insta-post';


@injectable()
export class ScraperUtil {
  private readonly logger: Logger = new Logger(this);
  private readonly PAGES_TO_SCRAPE: number = 1; //5;

  constructor(
    private instagram: InstagramClient
  ) { }

  public transformPost(post: InstaResponseItem): InstaPost {
    if (!has(post, 'location')) {
      return null;
    }
    if (!has(post, 'image_versions2.candidates[0].url')) {
      return null;
    }

    const instaPost = post as InstaPost;
    const lat = get(post, 'location.latitude') || get(post, 'location.lat');
    const lng = get(post, 'location.longitude') || get(post, 'location.lng');
    if (!lat || !lng) {
      return null;
    }

    instaPost.location.geopoint = GeoFireUtil.createLocation(+lat, +lng);

    return instaPost;
  }

  async storePosts(posts: InstaPost[]): Promise<void> {
    this.logger.log("Storing posts", posts.length);

    const scrapedPostDto = getModelForClass(ScrapedPostDto);

    for (const post of posts) {
      const latitude: number = Number(get(post, 'location.latitude') || get(post, 'location.lat'));
      const longitude: number = Number(get(post, 'location.longitude') || get(post, 'location.lng'));

      await scrapedPostDto.findOneAndUpdate({
        code: post.code
      }, {
        code: post.code,
        images: post.image_versions2.candidates.map(image => ({
          width: image.width,
          height: image.height,
          url: image.url
        })),
        username: get(post, 'user.username') || get(post, 'user.name'),
        like_count: post.like_count,
        caption: post.caption.text,
        taken_at: post.taken_at,
        location: [latitude, longitude],
      }, { upsert: true });

    };
  }

  async getByUser(username: string): Promise<UserFeedResponseItem[]> {
    this.logger.log(username, 'getByUser');
    const account = await this.instagram.client.user.searchExact(username);
    if (account) {
      const feed = await this.instagram.feed.user(account.pk);

      const scrapedUserDto = getModelForClass(ScrapedUserDto);
      await scrapedUserDto.findOneAndUpdate({ username }, { username }, { upsert: true });

      const posts: UserFeedResponseItem[] = [];
      for (let i = 0; i < this.PAGES_TO_SCRAPE; i++) {
        posts.push(...(await feed.items() as UserFeedResponseItem[]));
      }
      const filteredPosts = posts.filter(InstagramUtil.isValidImage);
      this.logger.log(username, 'Retrieved', filteredPosts.length, 'items');
      return filteredPosts;
    }

    return [];
  }

  async getByHashtag(hashtag: string): Promise<TagFeedResponseItemsItem[]> {
    this.logger.log(hashtag, 'getByHashtag');
    const feed = await this.instagram.feed.tags(hashtag, 'top');

    const scrapedHashtagDto = getModelForClass(ScrapedHashtagDto);
    await scrapedHashtagDto.findOneAndUpdate({ hashtag }, { hashtag }, { upsert: true });

    const posts: TagFeedResponseItemsItem[] = [];
    for (let i = 0; i < this.PAGES_TO_SCRAPE; i++) {
      posts.push(...(await feed.items() as TagFeedResponseItemsItem[]));
    }
    const filteredPosts = posts.filter(post => InstagramUtil.isValidImage(post) && InstagramUtil.hasHighLikeCount(post));
    this.logger.log(hashtag, 'Retrieved', filteredPosts.length, 'items');
    return filteredPosts;
  }

  async getByLocation(locationId: string): Promise<LocationFeedResponseMedia[]> {
    this.logger.log(locationId, 'getByLocation');
    locationId = locationId + '';
    const feed = await this.instagram.feed.location(locationId, 'ranked');

    const scrapedLocationDto = getModelForClass(ScrapedLocationDto);
    await scrapedLocationDto.findOneAndUpdate({ locationId }, { locationId }, { upsert: true });

    const posts: LocationFeedResponseMedia[] = [];
    for (let i = 0; i < this.PAGES_TO_SCRAPE; i++) {
      posts.push(...(await feed.items() as LocationFeedResponseMedia[]));
    }
    const filteredPosts = posts.filter(post => InstagramUtil.isValidImage(post) && InstagramUtil.hasHighLikeCount(post));
    this.logger.log(locationId, 'Retrieved', filteredPosts.length, 'items');
    return filteredPosts;
  }

}

