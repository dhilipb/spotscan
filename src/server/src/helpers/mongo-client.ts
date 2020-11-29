import * as Mongoose from 'mongoose';
import { injectable } from 'tsyringe';

import { Config } from './config';
import { Logger } from './logger';

@injectable()
export class MongoClient {

  private readonly logger: Logger = new Logger(this);

  public database: Mongoose.Connection;

  public async connect(): Promise<any> {
    if (this.database) {
      return;
    }

    this.logger.log('Connecting to database', Config.MongoDb.Credentials);
    await Mongoose.connect(Config.MongoDb.Credentials, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: Config.MongoDb.IsReplicaSet,
      useCreateIndex: true,
    }).then(() => {
      this.logger.log("Connected to database");
      this.database = Mongoose.connection;
    }, error => {
      console.log(error);
    });
  }

  public disconnect(): void {
    Mongoose.disconnect();
  }

}