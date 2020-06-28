import { Controller, Delete, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { FirebaseClient } from '../helpers/firebase';
import { GeoFireUtil } from '../helpers/geofire.util';
import { Logger } from '../helpers/logger';

@injectable()
@Controller('api/markers')
export class MarkersController {
  private readonly logger: Logger = new Logger(this);

  constructor(
    private firebaseClient: FirebaseClient
  ) { }

  @Get(':latitude/:longitude')
  public async getMarkers(req: Request, res: Response): Promise<Response> {
    const latitude = +req.params.latitude;
    const longitude = +req.params.longitude;

    const point = GeoFireUtil.createLocation(latitude, longitude);
    return res.json(await this.firebaseClient.posts.geoQuery(point));
  }

  @Delete(':code')
  public async deleteMarker(req: Request, res: Response): Promise<Response> {
    const code = req.params.code;
    this.logger.log('Deleting', code);
    await this.firebaseClient.posts.remove(code);
    return res.json({});
  }

}
