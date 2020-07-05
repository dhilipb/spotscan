import { getModelForClass } from '@typegoose/typegoose';
import { shuffle } from 'lodash';
import { injectable } from 'tsyringe';

import { InstaPost } from '../../shared/models/insta-post';
import { Logger, Util } from './helpers';
import { ScrapedHashtagDto, ScrapedLocationDto, ScrapedUserDto } from './models/insta-post';
import { ScraperUtil } from './scraper-util';

@injectable()
export class Scraper {
  private readonly logger: Logger = new Logger(this);

  constructor(
    private scraperUtil: ScraperUtil
  ) { }

  async scrapeUser(username: string, storeResults: boolean = true): Promise<InstaPost[]> {
    if (!username) {
      return [];
    }

    const posts = await this.scraperUtil.getByUser(username);
    const simplifiedPosts: InstaPost[] = posts.map(this.scraperUtil.transformPost).filter(post => post);
    if (storeResults) {
      await this.scraperUtil.storePosts(simplifiedPosts);
    }
    return simplifiedPosts;
  }
  async scrapeTag(tag: string, storeResults: boolean = true): Promise<InstaPost[]> {
    if (!tag) {
      return [];
    }

    const posts = await this.scraperUtil.getByHashtag(tag);
    const simplifiedPosts: InstaPost[] = posts.map(this.scraperUtil.transformPost).filter(post => post);
    if (storeResults) {
      await this.scraperUtil.storePosts(simplifiedPosts);
    }
    return simplifiedPosts;
  }
  async scrapeLocation(locationId: string, storeResults: boolean = false): Promise<InstaPost[]> {
    if (!locationId) {
      return [];
    }

    const posts = await this.scraperUtil.getByLocation(locationId);
    const simplifiedPosts: InstaPost[] = posts.map(this.scraperUtil.transformPost).filter(post => post);
    if (storeResults) {
      await this.scraperUtil.storePosts(simplifiedPosts);
    }
    return simplifiedPosts;
  }

  async update(): Promise<void> {
    const users = shuffle((await getModelForClass(ScrapedUserDto).find()).map(model => model.username));
    const tags = shuffle((await getModelForClass(ScrapedHashtagDto).find()).map(model => model.hashtag));
    const locations = shuffle((await getModelForClass(ScrapedLocationDto).find()).map(model => model.locationId));

    for (const user of users) {
      this.logger.log("Scraping user", user);
      await this.scrapeUser(user);
    }
    await Util.randomSleep();
    for (const tag of tags) {
      this.logger.log("Scraping tag", tag);
      await this.scrapeTag(tag);
    }
    await Util.randomSleep();
    for (const location of locations) {
      this.logger.log("Scraping location", location);
      await this.scrapeLocation(location);
    }
  }

}
