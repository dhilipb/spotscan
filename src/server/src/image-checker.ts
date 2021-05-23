import { Client } from '@rmp135/imgur';
import { getModelForClass, post } from '@typegoose/typegoose';
import axios from 'axios';
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
      let imageUrl = last(post.images) // use the smallest image
      this.logger.log('Checking image', post.code)

      if (imageUrl.includes('instagram.com')) {
        // Update image to imgur

        const updatedImage = this.refreshImage(post);
        if (updatedImage) {
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

  public async refreshImage(post: ScrapedPostDto) {
    let imageUrl = last(post.images) // use the smallest image
    if (!imageUrl.includes('instagram.com')) {
      return post;
    }

    if (!this.isInstagramImageValid(imageUrl)) {
      const transformedPost = await this.refreshImageFromInstagram(post.mediaId);
      imageUrl = last(transformedPost.images);
      post.images = [imageUrl];

      this.logger.log(post.code, 'Uploading to imgur')
      const imgurImage = await this.imgurClient.Image.upload(imageUrl, { type: 'url' }).catch(error => this.logger.log(error))
      const imgurLink = get(imgurImage, 'data.link')

      if (imgurLink) {
        this.logger.log(post.code, 'Uploaded to imgur', imgurLink);
        post.images = [imgurLink]
        return await getModelForClass(ScrapedPostDto).findOneAndUpdate({ code: post.code }, post)
      }
    }

    return null;
  }

  private async isInstagramImageValid(imageUrl: string): Promise<boolean> {
    const imageContent = (await axios.get(imageUrl)).data;
    return imageContent.includes('URL signature expired');
  }

  private async refreshImageFromInstagram(mediaId: string): Promise<ScrapedPostDto> {
    const mediaInfo = this.instagram.media.info(mediaId)
    const media = (await mediaInfo).items[0]
    const transformedPost = this.scraperUtil.transformPost(media)
    return transformedPost;
  }
}
