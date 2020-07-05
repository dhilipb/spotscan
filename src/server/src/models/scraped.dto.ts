import { index, modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ options: { customName: 'User' } })
export class ScrapedUserDto {
  @prop({ index: true, unique: true })
  username: string;

  @prop({ default: -1 })
  lastScraped: Date;
}

@modelOptions({ options: { customName: 'Hashtag' } })
export class ScrapedHashtagDto {
  @prop({ index: true, unique: true })
  hashtag: string;

  @prop({ default: -1 })
  lastScraped: Date;
}

@modelOptions({ options: { customName: 'Location' } })
export class ScrapedLocationDto {
  @prop({ index: true, unique: true })
  locationId: string;

  @prop({ default: -1 })
  lastScraped: Date;
}
