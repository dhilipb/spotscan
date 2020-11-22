import { Server } from '@overnightjs/core';
import * as cors from 'cors';
import * as express from 'express';
import * as morgan from 'morgan';
import * as path from 'path';
import { injectable } from 'tsyringe';

import { Config } from '../helpers/config';
import { Logger } from '../helpers/logger';
import { DiscoverController } from './discover.controller';
import { MarkersController } from './markers.controller';

@injectable()
export class AppRouteController extends Server {
  private readonly logger: Logger = new Logger(this);

  constructor(
    private markersController: MarkersController,
    private discoverController: DiscoverController
  ) {
    super(true); // process.env.NODE_ENV === 'development'); // setting showLogs to true
  }

  private setupControllers(): void {
    if (!Config.Production) {
      this.app.use(cors());
    }

    this.app.use(morgan('dev'));

    const staticLocation = path.join(process.cwd(), 'dist', 'frontend');
    this.app.use(express.static(staticLocation));
    super.addControllers([this.markersController, this.discoverController]);
  }

  public start(port: number): void {
    this.setupControllers();
    this.app.listen(port, () => {
      this.logger.log('Server listening on port: ' + port);
    });
  }

}
