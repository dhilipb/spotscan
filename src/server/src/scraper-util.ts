import { getModelForClass } from '@typegoose/typegoose';
import { LocationFeedResponseMedia, TagFeedResponseItemsItem } from 'instagram-private-api';
import { get, has } from 'lodash';
import { injectable } from 'tsyringe';

import { InstagramClient, Logger } from './helpers';
import { InstagramUtil } from './instagram-util';
import {
  InstaResponseItem,
  ScrapedHashtagDto,
  ScrapedLocationDto,
  ScrapedPostDto,
  ScrapedUserDto,
  UserFeedResponseItem,
} from './models';

@injectable()
export class ScraperUtil {
  private readonly logger: Logger = new Logger(this)
  private readonly PAGES_TO_SCRAPE: number = 10

  constructor(private instagram: InstagramClient) { }

  public transformPost(post: InstaResponseItem): ScrapedPostDto {
    if (!has(post, 'location')) {
      return null
    }
    if (!has(post, 'image_versions2.candidates[0].url')) {
      return null
    }

    const latitude: number = parseFloat(get(post, 'location.latitude') || get(post, 'location.lat'))
    const longitude: number = parseFloat(get(post, 'location.longitude') || get(post, 'location.lng'))
    if (!latitude || !longitude) {
      return null
    }

    const images = post.image_versions2.candidates.map((image) => image.url)

    const scrapedPostDto = {
      code: post.code,
      mediaId: post.id,
      images: images,
      username: get(post, 'user.username') || get(post, 'user.name'),
      like_count: post.like_count,
      caption: post.caption?.text || '',
      taken_at: post.taken_at,
      location: [latitude, longitude],
    } as ScrapedPostDto

    return scrapedPostDto
  }

  async storePosts(posts: ScrapedPostDto[]): Promise<void> {
    if (!posts.length) {
      return;
    }

    this.logger.log('Storing posts', posts.length)

    const scrapedPostDto = getModelForClass(ScrapedPostDto)

    for (const post of posts) {
      await scrapedPostDto.findOneAndUpdate({ code: post.code }, post, { upsert: true }).catch((error) => this.logger.log('Could not store', post.code, error.codeName))
    }
  }

  async getByUser(username: string): Promise<UserFeedResponseItem[]> {
    this.logger.log(username, 'getByUser')


    const scrapedUserDto = getModelForClass(ScrapedUserDto)

    const account = await this.instagram.client.user.searchExact(username).catch((e) => this.logger.error(e))
    if (account && !account.is_private) {
      const feed = await this.instagram.feed.user(account.pk)

      await scrapedUserDto.findOneAndUpdate({ username }, { username, lastScraped: new Date() }, { upsert: true })


      const posts: UserFeedResponseItem[] = []
      for (let i = 0; i < this.PAGES_TO_SCRAPE; i++) {
        posts.push(...((await feed.items()) as UserFeedResponseItem[]))
        // await Util.randomSleep();
      }

      // Add users found
      const usersFound = this.findUsersFromPosts(posts);
      console.log(usersFound);

      const filteredPosts = posts.filter(InstagramUtil.isValidImage)
      this.logger.log(username, 'Retrieved:', posts.length, 'Filtered:', filteredPosts.length, 'items')
      return filteredPosts
    } else {
      this.logger.log(username, 'Deleting - private or unknown user')
      await scrapedUserDto.deleteOne({ username }).exec()
      await getModelForClass(ScrapedPostDto).deleteMany({ username }).exec()
    }

    return []
  }

  private findUsersFromPosts(posts: UserFeedResponseItem[]) {
    const usersFound = new Set();
    posts.forEach(post => {
      let ids = (post.caption?.text ?? '').match(/@(.*?)[\s\r\n]/g) || [];
      ids.forEach(id => {
        usersFound.add(id.trim().replace('@', ''));
      });
    });
    return usersFound;
  }

  async getByHashtag(hashtag: string): Promise<TagFeedResponseItemsItem[]> {
    this.logger.log(hashtag, 'getByHashtag')
    const feed = await this.instagram.feed.tags(hashtag, 'top')

    const scrapedHashtagDto = getModelForClass(ScrapedHashtagDto)
    await scrapedHashtagDto.findOneAndUpdate({ hashtag }, { hashtag, lastScraped: new Date() }, { upsert: true })

    const posts: TagFeedResponseItemsItem[] = []
    for (let i = 0; i < this.PAGES_TO_SCRAPE; i++) {
      posts.push(...((await feed.items()) as TagFeedResponseItemsItem[]))
      // await Util.randomSleep();
    }
    const filteredPosts = posts.filter((post) => InstagramUtil.isValidImage(post) && InstagramUtil.hasHighLikeCount(post))
    this.logger.log(hashtag, 'Retrieved', filteredPosts.length, 'items')
    return filteredPosts
  }

  async getByLocation(locationId: string): Promise<LocationFeedResponseMedia[]> {
    this.logger.log(locationId, 'getByLocation')
    locationId = locationId + ''
    const feed = await this.instagram.feed.location(locationId, 'ranked')

    const scrapedLocationDto = getModelForClass(ScrapedLocationDto)
    await scrapedLocationDto.findOneAndUpdate({ locationId }, { locationId, lastScraped: new Date() }, { upsert: true })

    const posts: LocationFeedResponseMedia[] = []
    for (let i = 0; i < 2; i++) {
      posts.push(...((await feed.items()) as LocationFeedResponseMedia[]))
      // await Util.randomSleep();
    }
    const filteredPosts = posts.filter((post) => InstagramUtil.isValidImage(post) && InstagramUtil.hasHighLikeCount(post))
    this.logger.log(locationId, 'Retrieved', filteredPosts.length, 'items')
    return filteredPosts
  }
}
