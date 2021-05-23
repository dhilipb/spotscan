import 'reflect-metadata';

import * as fs from 'fs';
import * as path from 'path';
import { container, injectable } from 'tsyringe';

import { Config, ConfigUpdater, InstagramClient, Logger } from './helpers';
import { MongoClient } from './helpers/mongo-client';
import { AppRouteController } from './http-controllers/app-route.controller';
import { ImageChecker } from './image-checker';
import { Scraper } from './scraper';

@injectable()
class InstaMapsApp {
  private readonly logger: Logger = new Logger(this)

  constructor(
    private appRouteController: AppRouteController,
    private instagram: InstagramClient,
    private mongoClient: MongoClient,
    private scraper: Scraper,
    private imageChecker: ImageChecker,
    private configUpdater: ConfigUpdater
  ) { }

  async init(): Promise<void> {
    this.configUpdater.initConfig();

    this.appRouteController.start(+process.env.PORT || 3000)

    await this.mongoClient.connect()
    await this.setupInstagram()

    this.logger.log('DeletePass ?admin=' + Config.Admin.DeletePass);
  }

  private async setupInstagram(): Promise<void> {
    const usersJsonFile = Config.Production ? path.join(process.cwd(), 'dist', 'secret', 'users.json') : path.join(process.cwd(), 'secret', 'users.json')
    const userCredentials = JSON.parse(fs.readFileSync(usersJsonFile, 'utf-8'))
    if (userCredentials.username && userCredentials.password) {
      await this.instagram.login(userCredentials.username, userCredentials.password)
      await this.scraper.update()

      if (Config.Instagram.ImageChecker) {
        this.imageChecker.check()
      }
    }
  }
}

require('dotenv').config()

const app = container.resolve(InstaMapsApp)
app.init()
