import { Controller, Delete, Get } from '@overnightjs/core';
import { getModelForClass } from '@typegoose/typegoose';
import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { Logger } from '../helpers/logger';
import { ScrapedPostDto } from '../models';

@injectable()
@Controller('api/markers')
export class MarkersController {
  private readonly logger: Logger = new Logger(this);
  private scrapedPostDto = getModelForClass(ScrapedPostDto);

  @Get(':latitude/:longitude')
  public async getMarkersAll(req: Request, res: Response): Promise<Response> {
    return res.json(await this.getMarkers(+req.params.latitude, +req.params.longitude));
  }

  @Get('londonunmasked/:latitude/:longitude')
  public async getMarkersLU(req: Request, res: Response): Promise<Response> {
    return res.json(await this.getMarkers(+req.params.latitude, +req.params.longitude, 'londonunmasked'));
  }


  private async getMarkers(latitude: number, longitude: number, username: string = null): Promise<ScrapedPostDto> {
    // await this.scrapedPostDto.syncIndexes();

    return this.scrapedPostDto
      .where('location').near({
        center: {
          type: 'Point',
          coordinates: [latitude, longitude]
        },
        maxDistance: 500000
      })
      .where(username ? 'username' : '', username);
    // .sort({ like_count: -1 })
    // .limit(500);
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
