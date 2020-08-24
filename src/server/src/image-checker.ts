import { getModelForClass } from '@typegoose/typegoose';
import { MediaEntity } from 'instagram-private-api';
import { last } from 'lodash';
import * as fetch from 'node-fetch';
import { injectable } from 'tsyringe';

import { InstagramClient, Logger, Util } from './helpers';
import { ScrapedPostDto } from './models';
import { ScraperUtil } from './scraper-util';

@injectable()
export class ImageChecker {
  private readonly logger: Logger = new Logger(this);

  constructor(
    private instagram: InstagramClient,
    private scraperUtil: ScraperUtil
  ) { }

  async check(): Promise<void> {
    this.logger.log('Running checkers');

    const posts = await getModelForClass(ScrapedPostDto).find().exec();
    for (let post of posts) {
      const image = last(last(post.images));
      this.logger.log('Checking image', post.code);

      const imageContent = await (await fetch(image)).text();
      if (imageContent.includes('URL signature expired')) {
        this.logger.log(imageContent);

        const mediaInfo = await MediaEntity.oembed('https://instagram.com/p/' + post.code);
        post.images = [
          mediaInfo.thumbnail_url
        ];
        this.logger.log('Updating', post.code);
        await getModelForClass(ScrapedPostDto).findOneAndUpdate({ code: post.code }, post);
      }
      await Util.randomSleep(2, 10);

    }

  }

}