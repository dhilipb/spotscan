import 'reflect-metadata';

import { container, injectable } from 'tsyringe';

import * as userCredentials from '../secret/users.json';
import { InstagramClient, Logger } from './helpers';
import { MongoClient } from './helpers/mongo-client';
import { AppRouteController } from './http-controllers/app-route.controller';
import { Scraper } from './scraper';


@injectable()
class InstaMapsApp {
  private readonly logger: Logger = new Logger(this);

  constructor(
    private appRouteController: AppRouteController,
    private instagram: InstagramClient,
    private mongoClient: MongoClient,
    private scraper: Scraper
  ) {
  }

  async init(): Promise<void> {
    this.mongoClient.connect();
    this.appRouteController.start(+process.env.PORT || 3000);
    await this.setupInstagram();
  }

  private async setupInstagram(): Promise<void> {
    if (userCredentials.username && userCredentials.password) {
      await this.instagram.login(userCredentials.username, userCredentials.password);
      await this.scraper.scrapeUser("london");
    }
  }
}

const app = container.resolve(InstaMapsApp);
app.init();
