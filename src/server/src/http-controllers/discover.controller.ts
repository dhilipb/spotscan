import { Controller, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { take } from 'lodash';
import { injectable } from 'tsyringe';

import { InstagramClient } from '../helpers/instagram';
import { Logger } from '../helpers/logger';
import { Scraper } from '../scraper';

@injectable()
@Controller('api/discover')
export class DiscoverController {
  private readonly logger: Logger = new Logger(this);

  constructor(
    private instagram: InstagramClient,
    private scraper: Scraper
  ) { }

  @Get('user/:username')
  public async user(req: Request, res: Response): Promise<Response> {
    const username = req.params.username;
    this.logger.log('Retrieving for user: ' + username);
    const items = await this.scraper.scrapeUser(username);
    return res.json({ items: items.length });
  }

  @Get('tag/:hashtag')
  public async hashtag(req: Request, res: Response): Promise<Response> {
    const hashtag = req.params.hashtag;
    this.logger.log('Retrieving for hashtag: ' + hashtag);
    const items = await this.scraper.scrapeTag(hashtag);
    return res.json({ items: items.length });
  }

  @Get('location/:latitude/:longitude')
  public async location(req: Request, res: Response): Promise<Response> {
    const latitude = +req.params.latitude;
    const longitude = +req.params.longitude;

    const locationsSearch = await this.instagram.client.search.location(latitude, longitude);
    // this.logger.log(locationsSearch);
    const topLocations = take(locationsSearch, 3);
    const posts = [];
    for (const location of topLocations) {
      const simplifiedPosts = await this.scraper.scrapeLocation(location?.external_id);
      posts.push(...simplifiedPosts);
    }
    return res.json(posts);
  }

  @Get('update')
  public async update(req: Request, res: Response): Promise<Response> {
    await this.scraper.update();
    return res.json({});
  }


}
