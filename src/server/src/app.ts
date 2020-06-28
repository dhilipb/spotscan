import 'reflect-metadata';

import { container, injectable } from 'tsyringe';

import * as userCredentials from '../secret/users.json';
import { InstagramClient, Logger } from './helpers';
import { AppRouteController } from './http-controllers/app-route.controller';


@injectable()
class InstaMapsApp {
  private readonly logger: Logger = new Logger(this);

  constructor(
    private appRouteController: AppRouteController,
    private instagram: InstagramClient
  ) {
  }

  async init(): Promise<void> {
    this.appRouteController.start(+process.env.PORT || 3000);
    await this.setupInstagram();
  }

  private async setupInstagram(): Promise<void> {
    if (userCredentials.username && userCredentials.password) {
      await this.instagram.login(userCredentials.username, userCredentials.password);
    }
  }
}

const app = container.resolve(InstaMapsApp);
app.init();
