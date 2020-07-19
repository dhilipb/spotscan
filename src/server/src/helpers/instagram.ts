import * as fs from 'fs';
import { IgApiClient } from 'instagram-private-api';
import { FeedFactory } from 'instagram-private-api/dist/core/feed.factory';
import { State } from 'instagram-private-api/dist/core/state';
import { AccountRepository } from 'instagram-private-api/dist/repositories/account.repository';
import { MediaRepository } from 'instagram-private-api/dist/repositories/media.repository';
import { UserRepository } from 'instagram-private-api/dist/repositories/user.repository';
import * as path from 'path';
import { singleton } from 'tsyringe';

import { Config } from './config';
import { Logger } from './logger';


@singleton()
export class InstagramClient {
  private readonly logger: Logger = new Logger(this);

  public client: IgApiClient = new IgApiClient();
  public feed: FeedFactory;
  public account: AccountRepository;
  public media: MediaRepository;
  public user: UserRepository;
  public state: State;

  public username: string;

  public userCookiePath: string;
  public userDevicePath: string;

  public pk: number;

  constructor(
  ) {
    // Proxy requests
    this.feed = this.client.feed;
    this.account = this.client.account;
    this.media = this.client.media;
    this.user = this.client.user;
    this.state = this.client.state;
  }

  async login(username: string, password: string): Promise<void> {
    if (!(username && password)) {
      throw new Error('Username or password not provided' + username);
    }

    this.logger.setUser(username);

    this.username = username;

    // Cookie

    this.userCookiePath = Config.Production ? path.join(process.cwd(), 'dist', 'secret', `cookie-${this.username}.json`) : path.join(process.cwd(), 'secret', `cookie-${this.username}.json`);
    this.userDevicePath = Config.Production ? path.join(process.cwd(), 'dist', 'secret', `cookie-device-${this.username}.json`) : path.join(process.cwd(), 'secret', `cookie-device-${this.username}.json`);

    await this.checkIfValid();

    if (!(await this.restoreState())) {
      this.logger.log('Logging in from fresh', username);

      this.state.generateDevice(username);
      await this.client.simulate.preLoginFlow();

      const auth = await this.client.account.login(username, password).catch(e => async () => {
        this.logger.log(e);
        this.validateChallenge();
      });

      if (auth) {
        this.pk = auth['pk'];
      }
      await this.saveState();
    }

    this.logger.log('Logged in');
  }

  private async checkIfValid(): Promise<void> {
    let shouldDeleteCookies = Config.Instagram.DeleteCookies;
    if (!shouldDeleteCookies && fs.existsSync(this.userCookiePath)) {
      const cookieJson = JSON.parse(fs.readFileSync(this.userCookiePath, 'utf-8'));
      const cookie = cookieJson.cookies.find(c => c.key === 'csrftoken');
      const cookieCreation = new Date(cookie.creation).getTime();

      const now = new Date();
      const expiryDate = now.setDate(now.getDate() - 5);

      const isExpired = expiryDate > cookieCreation;
      if (isExpired) {
        shouldDeleteCookies = true;
      }
    }

    if (shouldDeleteCookies) {
      this.logger.log('Deleting cookies');
      fs.unlinkSync(this.userCookiePath);
      fs.unlinkSync(this.userDevicePath);
    }
  }

  private async saveState(): Promise<void> {
    this.logger.log('Saving state');
    const cookieJar = await this.state.serializeCookieJar();
    await fs.writeFileSync(this.userCookiePath, JSON.stringify(cookieJar), 'utf-8');

    const device = (({ deviceString, deviceId, uuid, adid, build }) => ({
      deviceString,
      deviceId,
      uuid,
      adid,
      build
    }))(this.state);
    await fs.writeFileSync(this.userDevicePath, JSON.stringify(device), 'utf-8');
  }

  private async restoreState(): Promise<boolean> {
    try {
      if (fs.existsSync(this.userCookiePath) && fs.existsSync(this.userDevicePath)) {
        this.logger.log('Restoring from cookies');
        const savedCookie = await fs.readFileSync(this.userCookiePath, 'utf-8');
        const savedDevice = JSON.parse(fs.readFileSync(this.userDevicePath, 'utf-8'));
        await this.state.deserializeCookieJar(savedCookie);
        this.state.deviceString = savedDevice.deviceString;
        this.state.deviceId = savedDevice.deviceId;
        this.state.uuid = savedDevice.uuid;
        this.state.adid = savedDevice.adid;
        this.state.build = savedDevice.build;
        this.pk = await this.client.user.getIdByUsername(this.username);
        return true;
      }
    } catch (e) {
      if (e.name === 'IgCheckpointError') {
        await this.validateChallenge();
        return this.restoreState();
      }
    }
    return false;
  }

  private async validateChallenge(): Promise<void> {
    this.logger.log(this.state.checkpoint); // Checkpoint info here
    await this.client.challenge.auto(true); // Requesting sms-code or click "It was me" button
    this.logger.log(this.state.checkpoint); // Challenge info here

    const code = process.env.CHALLENGE_CODE;
    if (code) {
      this.logger.log(await this.client.challenge.sendSecurityCode(code));
    }
  }

}
