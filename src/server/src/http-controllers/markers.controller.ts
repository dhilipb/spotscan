import { Controller, Delete, Get } from '@overnightjs/core';
import { getModelForClass } from '@typegoose/typegoose';
import { Request, Response } from 'express';
import { Config } from 'src/helpers';
import { injectable } from 'tsyringe';

import { Logger } from '../helpers/logger';
import { ScrapedPostDto } from '../models';

@injectable()
@Controller('api/markers')
export class MarkersController {
  private readonly logger: Logger = new Logger(this);
  private scrapedPostDto = getModelForClass(ScrapedPostDto);

  @Get('')
  public async getMarkersAll(req: Request, res: Response): Promise<Response> {
    const referer = req?.headers?.referer || '';
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
    const model = await getModelForClass(ScrapedPostDto);
    const count = await model.count({}).exec();
    return res.json({ count });
  }


  private async getMarkers(latitude: number, longitude: number, radius: number, username: string = null): Promise<ScrapedPostDto> {
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

  @Delete(':code')
  public async deleteMarker(req: Request, res: Response): Promise<Response> {
    const code = req.params.code;
    if (req.headers.referer.includes('http://localhost:4200') || req.headers.referer.includes('admin=' + Config.Admin.DeletePass)) {
      this.logger.log('Deleting', code);
      await this.scrapedPostDto.findOneAndDelete({ code });
      return res.json({ success: true });
    }
    return res.json({ success: false });
  }

}
