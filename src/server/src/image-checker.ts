import { Client } from '@rmp135/imgur';
import { getModelForClass } from '@typegoose/typegoose';
import { get, last } from 'lodash';
import { injectable } from 'tsyringe';

import { Config, InstagramClient, Logger, TimeUnit, Util } from './helpers';
import { ScrapedPostDto } from './models';
import { ScraperUtil } from './scraper-util';

@injectable()
export class ImageChecker {
  private readonly logger: Logger = new Logger(this)
  private imgurClient: Client

  constructor(private instagram: InstagramClient, private scraperUtil: ScraperUtil) {
    const clientId = Util.randomFrom(Config.Imgur.ClientId.split(','));
    this.imgurClient = new Client(clientId);
  }

  async check(): Promise<void> {
    this.logger.log('Running checkers')

    const posts = await getModelForClass(ScrapedPostDto).find().exec()
    for (let post of posts) {
      let image = last(post.images) // use the smallest image
      this.logger.log('Checking image', post.code)

      if (image.includes('instagram.com')) {
        // Update image to imgur

        if (!this.isInstagramImageValid(image)) {
          const transformedPost = await this.refreshImageFromInstagram(post.mediaId);
          image = last(transformedPost.images);
        }

        this.logger.log(post.code, 'Uploading to imgur')
        const imgurImage = await this.imgurClient.Image.upload(image, { type: 'url' }).catch(error => this.logger.log(error))
        const imgurLink = get(imgurImage, 'data.link')

        if (imgurLink) {
          this.logger.log(post.code, 'Uploaded to imgur', imgurLink);
          post.images = [imgurLink]
          await getModelForClass(ScrapedPostDto).findOneAndUpdate({ code: post.code }, post)
          await Util.randomSleep(30, 60)
        
        } else {
          // error with imgur
          await Util.randomSleep(2, 10, TimeUnit.MINUTES)
        }
        

      } else {
        // Refresh image from instagram
        const shouldRefresh = false

        if (shouldRefresh) {
          this.logger.log(post.code, 'Refreshing from instagram')
          const transformedPost = await this.refreshImageFromInstagram(post.mediaId);
          await getModelForClass(ScrapedPostDto).findOneAndUpdate({ mediaId: post.mediaId }, transformedPost)
          await Util.randomSleep(2, 10)
        }
      }
    }

    await Util.randomSleep(2, 10)
    this.check();
  }

  private async isInstagramImageValid(imageUrl: string): Promise<boolean> {
    return true; 
    const imageContent = await (await fetch(imageUrl)).text();
    return imageContent.includes('URL signature expired');
  }

  private async refreshImageFromInstagram(mediaId: string): Promise<ScrapedPostDto> {
    const mediaInfo = this.instagram.media.info(mediaId)
    const media = (await mediaInfo).items[0]
    const transformedPost = this.scraperUtil.transformPost(media)
    return transformedPost;
  }
}
