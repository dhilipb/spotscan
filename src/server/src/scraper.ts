import { injectable } from 'tsyringe';

import { InstaPost } from '../../shared/models/insta-post';
import { Logger } from './helpers';
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
  async scrapeHashtag(hashtag: string, storeResults: boolean = true): Promise<InstaPost[]> {
    if (!hashtag) {
      return [];
    }

    const posts = await this.scraperUtil.getByHashtag(hashtag);
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

}
