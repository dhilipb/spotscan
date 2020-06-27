import { injectable } from 'tsyringe';

import { Logger } from './helpers';
import { SimplePost } from './models';
import { ScraperUtil } from './scraper-util';

@injectable()
export class Scraper {
  private readonly logger: Logger = new Logger(this);

  constructor(
    private scraperUtil: ScraperUtil
  ) { }

  async scrapeUser(username: string, storeResults: boolean = true): Promise<SimplePost[]> {
    if (!username) {
      return [];
    }

    const posts = await this.scraperUtil.getByUser(username);
    const simplifiedPosts: SimplePost[] = posts.map(this.scraperUtil.transformPost).filter(post => post);
    if (storeResults) {
      await this.scraperUtil.storePosts(simplifiedPosts);
    }
    return simplifiedPosts;
  }
  async scrapeHashtag(hashtag: string, storeResults: boolean = true): Promise<SimplePost[]> {
    if (!hashtag) {
      return [];
    }

    const posts = await this.scraperUtil.getByHashtag(hashtag);
    const simplifiedPosts: SimplePost[] = posts.map(this.scraperUtil.transformPost).filter(post => post);
    if (storeResults) {
      await this.scraperUtil.storePosts(simplifiedPosts);
    }
    return simplifiedPosts;
  }
  async scrapeLocation(locationId: string, storeResults: boolean = false): Promise<SimplePost[]> {
    if (!locationId) {
      return [];
    }

    const posts = await this.scraperUtil.getByLocation(locationId);
    const simplifiedPosts: SimplePost[] = posts.map(this.scraperUtil.transformPost).filter(post => post);
    if (storeResults) {
      await this.scraperUtil.storePosts(simplifiedPosts);
    }
    return simplifiedPosts;
  }

}
