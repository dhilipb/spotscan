import { getModelForClass } from '@typegoose/typegoose';
import { shuffle } from 'lodash';
import { injectable } from 'tsyringe';

import { Config, Logger, TimeUnit, Util } from './helpers';
import { ScrapedHashtagDto, ScrapedLocationDto, ScrapedPostDto, ScrapedUserDto } from './models';
import { ScraperUtil } from './scraper-util';

@injectable()
export class Scraper {
  private readonly logger: Logger = new Logger(this)

  constructor(private scraperUtil: ScraperUtil) { }

  async scrapeUser(username: string, storeResults: boolean = true): Promise<ScrapedPostDto[]> {
    if (!username) {
      return []
    }

    const posts = (await this.scraperUtil.getByUser(username).catch((e) => this.logger.error(e))) || []
    const simplifiedPosts: ScrapedPostDto[] = posts.map(this.scraperUtil.transformPost).filter((post) => post)
    if (storeResults) {
      await this.scraperUtil.storePosts(simplifiedPosts)
    }
    return simplifiedPosts
  }

  async scrapeTag(tag: string, storeResults: boolean = true): Promise<ScrapedPostDto[]> {
    if (!tag) {
      return []
    }

    const posts = (await this.scraperUtil.getByHashtag(tag).catch((e) => this.logger.error(e))) || []
    const simplifiedPosts: ScrapedPostDto[] = posts.map(this.scraperUtil.transformPost).filter((post) => post)
    if (storeResults) {
      await this.scraperUtil.storePosts(simplifiedPosts)
    }
    return simplifiedPosts
  }

  async scrapeLocation(locationId: string, storeResults: boolean = false): Promise<ScrapedPostDto[]> {
    if (!locationId) {
      return []
    }

    const posts = (await this.scraperUtil.getByLocation(locationId).catch((e) => this.logger.error(e))) || []
    const simplifiedPosts: ScrapedPostDto[] = posts.map(this.scraperUtil.transformPost).filter((post) => post)
    if (storeResults) {
      await this.scraperUtil.storePosts(simplifiedPosts)
    }
    return simplifiedPosts
  }

  async update(): Promise<void> {

    // Scrape random users form list
    if (Config.Instagram.Scrape.Users) {
      let users = await getModelForClass(ScrapedUserDto).find().sort({ lastScraped: 'descending' }).exec()

      const userNames = shuffle(users.map((model) => model.username))
      for (const user of userNames) {
        this.logger.log('Scraping user', user)
        await this.scrapeUser(user)
        await Util.randomSleep(1, 5, TimeUnit.MINUTES)
      }
    }

    // Scrape random tags from list
    if (Config.Instagram.Scrape.Tags) {
      await Util.randomSleep()
      const tags = shuffle((await getModelForClass(ScrapedHashtagDto).find()).map((model) => model.hashtag))
      for (const tag of tags) {
        this.logger.log('Scraping tag', tag)
        await this.scrapeTag(tag)
      }
    }

    // Scrape random locations from list
    if (Config.Instagram.Scrape.Locations) {
      await Util.randomSleep()
      const locations = shuffle((await getModelForClass(ScrapedLocationDto).find()).map((model) => model.locationId))
      for (const location of locations) {
        this.logger.log('Scraping location', location)
        await this.scrapeLocation(location)
      }
    }
  }
}
