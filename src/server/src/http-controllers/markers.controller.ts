import { Controller, Delete, Get } from '@overnightjs/core';
import { getModelForClass } from '@typegoose/typegoose';
import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { Logger } from '../helpers/logger';
import { ScrapedPostDto } from '../models/scraped-post.dto';

@injectable()
@Controller('api/markers')
export class MarkersController {
  private readonly logger: Logger = new Logger(this);
  private scrapedPostDto = getModelForClass(ScrapedPostDto);

  @Get(':latitude/:longitude')
  public async getMarkers(req: Request, res: Response): Promise<Response> {
    const latitude = +req.params.latitude;
    const longitude = +req.params.longitude;

    await this.scrapedPostDto.syncIndexes();

    // const posts = [];
    const posts = await this.scrapedPostDto.where('location').near({
      center: {
        type: 'Point',
        coordinates: [latitude, longitude]
      },
      maxDistance: 500000
    }); //.where('username', 'londonunmasked');

    return res.json(posts);
  }

  @Delete(':code')
  public async deleteMarker(req: Request, res: Response): Promise<Response> {
    const code = req.params.code;
    if (req.headers.referer.includes('http://localhost:4200')) {
      this.logger.log('Deleting', code);
      await this.scrapedPostDto.findOneAndDelete({ code });
    }
    return res.json({});
  }

}
