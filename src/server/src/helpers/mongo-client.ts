import * as Mongoose from 'mongoose';
import { injectable } from 'tsyringe';

import { Config } from './config';
import { Logger } from './logger';

@injectable()
export class MongoClient {

  private readonly logger: Logger = new Logger(this);

  public database: Mongoose.Connection;

  public connect(): void {
    if (this.database) {
      return;
    }

    this.logger.log('Connecting to Database', Config.MongoDb.Credentials);
    Mongoose.connect(Config.MongoDb.Credentials, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });

    this.database = Mongoose.connection;
    this.database.once("open", async () => {
      this.logger.log("Connected to database");
    });
    this.database.on("error", e => {
      this.logger.log("Error connecting to database", e);
    });
  }

  public disconnect(): void {
    Mongoose.disconnect();
  }

}