import { index, modelOptions, prop } from '@typegoose/typegoose';

@index({ location: '2dsphere' })
@modelOptions({ options: { customName: 'Post' } })
export class ScrapedPostDto {

  @prop({ index: true, unique: true })
  code: string;

  @prop({ items: String })
  images: string[];

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
