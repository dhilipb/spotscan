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

      if (imageUrl.includes('instagram.com')) {
        // Update image to imgur
        this.logger.log(post.code, 'Checking image')

        const updatedImage = await this.refreshImage(post);
        if (updatedImage) {
          await Util.randomSleep(30, 60)
        } else {
          // error with imgur
          await Util.randomSleep(2, 10, TimeUnit.MINUTES)
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

    if (!(await this.isInstagramImageValid(imageUrl))) {
      this.logger.log(post.code, 'Invalid instagram image. Refreshing.');

      const transformedPost = await this.refreshImageFromInstagram(post.mediaId);
      imageUrl = last(transformedPost.images);
      post.images = [imageUrl];
    }

    this.logger.log(post.code, 'Uploading to imgur')
    const imgurImage = await this.imgurClient.Image.upload(imageUrl, { type: 'url' }).catch(error => this.logger.log(error))
    const imgurLink = get(imgurImage, 'data.link')

    if (imgurLink) {
      this.logger.log(post.code, 'Uploaded to imgur', imgurLink);
      post.images = [imgurLink]
      return await getModelForClass(ScrapedPostDto).findOneAndUpdate({ code: post.code }, post)
    }

    return null;
  }

  private async isInstagramImageValid(imageUrl: string): Promise<boolean> {
    try {
      const imageContent = (await axios.get(imageUrl)).data;
      this.logger.log(imageContent.length);
      return imageContent.includes('URL signature expired');
    } catch (error) {
      return false;
    }
  }

  private async refreshImageFromInstagram(mediaId: string): Promise<ScrapedPostDto> {
    const mediaInfo = this.instagram.media.info(mediaId)
    const media = (await mediaInfo).items[0]
    const transformedPost = this.scraperUtil.transformPost(media)
    return transformedPost;
  }
}
