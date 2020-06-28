import { LocationFeedResponseMedia, TagFeedResponseItemsItem } from 'instagram-private-api';
import { get, has, keys } from 'lodash';
import { injectable } from 'tsyringe';

import { InstaPost, InstaResponseItem, UserFeedResponseItem } from '../../shared/models/insta-post';
import { FirebaseClient, GenericFirebase, InstagramClient, Logger } from './helpers';
import { GeoFireUtil } from './helpers/geofire.util';
import { InstagramUtil } from './instagram-util';


@injectable()
export class ScraperUtil {
  private readonly logger: Logger = new Logger(this);

  constructor(
    private instagram: InstagramClient,
    private firebaseClient: FirebaseClient
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
    const storedPosts = (await this.firebaseClient.posts.get()) || {};
    for (const post of posts) {
      const isInFirebase = Object.keys(storedPosts).includes(post.code);
      if (isInFirebase) {
        this.logger.log(`${post.code} already exists`);
        continue;
      }
      await this.firebaseClient.posts.add(post.code, post);
    }
  }

  async getByUser(user: string): Promise<UserFeedResponseItem[]> {
    this.logger.log(user, 'getByUser');
    const account = await this.instagram.client.user.searchExact(user);
    if (account) {
      const feed = await this.instagram.feed.user(account.pk);

      // Get pages to scrape
      const pagesToScrape = await this.getPagesToScrape(this.firebaseClient.users, user);
      await this.firebaseClient.users.add(user, { lastScraped: new Date(), ...account });

      const posts: UserFeedResponseItem[] = [];
      for (let i = 0; i < pagesToScrape; i++) {
        posts.push(...(await feed.items() as UserFeedResponseItem[]));
      }
      const filteredPosts = posts.filter(InstagramUtil.isValidImage);
      this.logger.log(user, 'Retrieved', filteredPosts.length, 'items');
      return filteredPosts;
    }

    return [];
  }

  async getByHashtag(hashtag: string): Promise<TagFeedResponseItemsItem[]> {
    this.logger.log(hashtag, 'getByHashtag');
    const feed = await this.instagram.feed.tags(hashtag, 'top');

    // Get pages to scrape
    const pagesToScrape = await this.getPagesToScrape(this.firebaseClient.tags, hashtag);
    await this.firebaseClient.tags.add(hashtag, { lastScraped: new Date() });

    const posts: TagFeedResponseItemsItem[] = [];
    for (let i = 0; i < pagesToScrape; i++) {
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

    // Get pages to scrape
    const pagesToScrape = await this.getPagesToScrape(this.firebaseClient.locations, locationId);
    await this.firebaseClient.locations.add(locationId, { lastScraped: new Date() });

    const posts: LocationFeedResponseMedia[] = [];
    for (let i = 0; i < pagesToScrape; i++) {
      posts.push(...(await feed.items() as LocationFeedResponseMedia[]));
    }
    const filteredPosts = posts.filter(post => InstagramUtil.isValidImage(post) && InstagramUtil.hasHighLikeCount(post));
    this.logger.log(locationId, 'Retrieved', filteredPosts.length, 'items');
    return filteredPosts;
  }

  private async getPagesToScrape(firebaseCollection: GenericFirebase<any>, itemToSearch: string | number): Promise<number> {
    let pagesToScrape = 5;
    const records = (await firebaseCollection.get()) || {};
    if (!keys(records).includes(itemToSearch)) {
      pagesToScrape = 1;
    }
    return pagesToScrape;
  }

}

