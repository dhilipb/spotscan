import { Controller, Delete, Get } from '@overnightjs/core';
import { getModelForClass } from '@typegoose/typegoose';
import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { Config, Util } from '../helpers';
import { Logger } from '../helpers/logger';
import { ImageChecker } from '../image-checker';
import { ScrapedPostDto } from '../models';

@injectable()
@Controller('api/markers')
export class MarkersController {
  private readonly logger: Logger = new Logger(this);
  private scrapedPostDto = getModelForClass(ScrapedPostDto);

  constructor(
    private imageChecker: ImageChecker
  ) { }

  @Get('')
  public async getMarkersAll(req: Request, res: Response): Promise<Response> {
    const referer = req?.headers?.referer || '';
    if (referer.includes('admin=' + Config.Admin.DeletePass)) {
      const oneDayToSeconds = 24 * 60 * 60;
      res.cookie('admin', true, {
        maxAge: oneDayToSeconds
      });
    }

    if (referer.includes('localhost') || referer.includes('spotscan')) {
      return res.json(await this.getMarkers(+req.query.latitude, +req.query.longitude, +req.query.radius, req.params.user));
    }
    return res.json({});
  }

  @Get('londonunmasked')
  public async getMarkersLU(req: Request, res: Response): Promise<Response> {
    const referer = req?.headers?.referer || '';
    if (referer.includes('londonunmasked')) {
      return res.json(await this.getMarkers(+req.query.latitude, +req.query.longitude, +req.query.radius, 'londonunmasked'));
    }
    return res.json({});
  }

  @Get('count')
  public async getCount(req: Request, res: Response): Promise<Response> {
    const count = await this.scrapedPostDto.count({}).exec();
    return res.json({ count });
  }

  @Delete(':code')
  public async deleteMarker(req: Request, res: Response): Promise<Response> {
    const code = req.params.code as string;
    const cookies = Util.getCookies(req);
    if (cookies?.admin && code) {
      this.logger.log('Deleting', code);
      await this.scrapedPostDto.findOneAndDelete({ code });
      return res.json({ success: true });
    }

    this.logger.log('NOT deleting', code);
    return res.json({ success: false });
  }

  @Get(':code/refresh')
  public async refreshMarker(req: Request, res: Response): Promise<Response> {
    const code = req.params.code;
    const post = await this.scrapedPostDto.findOne({ code }).exec();
    const updatedPost = this.imageChecker.refreshImage(post);
    return res.json(updatedPost);
  }


  private async getMarkers(latitude: number, longitude: number, radius: number, username: string = null): Promise<any> {
    // await this.scrapedPostDto.syncIndexes();

    // Max 100 kms radius
    radius = Math.min(radius, 150 * 1000);

    return this.scrapedPostDto
      .where('location').near({
        center: {
          type: 'Point',
          coordinates: [latitude, longitude]
        },
        maxDistance: radius // in meters
      })
      .where(username ? 'username' : '', username)
      .sort({ like_count: -1 })
      .limit(1000);
  }


}
