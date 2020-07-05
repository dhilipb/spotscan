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

@index({ location: '2dsphere' })
@modelOptions({ options: { customName: 'Post' } })
export class ScrapedPostDto {

  @prop({ index: true, unique: true })
  code: string;

  @prop()
  images: any;

  @prop({ type: Number })
  location: [number, number];

  @prop()
  caption: string;

  @prop()
  username: string;

  @prop()
  like_count: number;

  @prop()
  taken_at: number;
}
