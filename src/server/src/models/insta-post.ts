import { index, modelOptions, prop } from '@typegoose/typegoose';

import { ImageCandidate } from '../../../shared/models/insta-post';

export class GeoPointDto {
  @prop({ default: 'Point' })
  type: string = 'Point';

  @prop()
  coordinates: number[];
}


@index({ username: 1 }, { unique: true })
@modelOptions({ options: { customName: 'User' } })
export class ScrapedUserDto {
  @prop()
  username: string;
}

@index({ hashtag: 1 }, { unique: true })
@modelOptions({ options: { customName: 'Hashtag' } })
export class ScrapedHashtagDto {
  @prop()
  hashtag: string;
}

@index({ locationId: 1 }, { unique: true })
@modelOptions({ options: { customName: 'Location' } })
export class ScrapedLocationDto {
  @prop()
  locationId: string;
}

@index({ location: '2dsphere' })
@modelOptions({ options: { customName: 'Post' } })
export class ScrapedPostDto {

  @prop({ index: true, unique: true })
  code: string;

  @prop()
  images?: ImageCandidate[];

  @prop({ type: Number })
  location: [number, number];

  @prop()
  caption?: string;
}
