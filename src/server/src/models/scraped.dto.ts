import { index, modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ options: { customName: 'User' } })
export class ScrapedUserDto {
  @prop({ index: true, unique: true })
  username: string;
}

@modelOptions({ options: { customName: 'Hashtag' } })
export class ScrapedHashtagDto {
  @prop({ index: true, unique: true })
  hashtag: string;
}

@modelOptions({ options: { customName: 'Location' } })
export class ScrapedLocationDto {
  @prop({ index: true, unique: true })
  locationId: string;
}
