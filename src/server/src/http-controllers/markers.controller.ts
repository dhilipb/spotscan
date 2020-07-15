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

  @Get(':latitude/:longitude/:zoom')
  public async getMarkersAll(req: Request, res: Response): Promise<Response> {
    return res.json(await this.getMarkers(+req.params.latitude, +req.params.longitude, +req.params.zoom));
  }

  @Get('londonunmasked/:latitude/:longitude/:zoom')
  public async getMarkersLU(req: Request, res: Response): Promise<Response> {
    return res.json(await this.getMarkers(+req.params.latitude, +req.params.longitude, +req.params.zoom, 'londonunmasked'));
  }


  private async getMarkers(latitude: number, longitude: number, zoom: number, username: string = null): Promise<ScrapedPostDto> {
    // await this.scrapedPostDto.syncIndexes();

    let maxDistanceKm: number = 20;
    if (zoom >= 12) {
      maxDistanceKm = 10;
    } else if (zoom === 11) {
      maxDistanceKm = 15;
    } else if (zoom <= 8) {
      maxDistanceKm = 100;
    }

    return this.scrapedPostDto
      .where('location').near({
        center: {
          type: 'Point',
          coordinates: [latitude, longitude]
        },
        maxDistance: maxDistanceKm * 1000 // in meters
      })
      .where(username ? 'username' : '', username)
      .sort({ like_count: -1 })
      .limit(500);
  }

  @Delete(':code')
  public async deleteMarker(req: Request, res: Response): Promise<Response> {
    const code = req.params.code;
    if (req.headers.referer.includes('http://localhost:4200')) {
      this.logger.log('Deleting', code);
      await this.scrapedPostDto.findOneAndDelete({ code });
      return res.json({ success: true });
    }
    return res.json({ success: false });
  }

}
