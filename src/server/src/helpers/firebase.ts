import * as firebase from 'firebase-admin';
import { isNil } from 'lodash';
import { singleton } from 'tsyringe';

import { InstaPost } from '../../../shared/models/insta-post';
import * as serviceAccount from '../../secret/firebase.json';
import { Config } from './config';
import { GeoFireUtil, GeoQueryArea } from './geofire.util';
import { Logger } from './logger';

import GeoPoint = firebase.firestore.GeoPoint;
// tslint:disable: max-classes-per-file
firebase.initializeApp({
  credential: firebase.credential.cert({
    projectId: serviceAccount.project_id,
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
  })
});

// Get a database reference to our blog
const firestore = firebase.firestore();

const WHAT_IF = Config.whatIfMode;

export class GenericFirebase<T> {
  private readonly logger: Logger = new Logger(this);
  private ref: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;
  public geoFireUtil: GeoFireUtil;

  constructor(private collection: string) {
    this.ref = firestore.collection(this.collection);
    this.geoFireUtil = new GeoFireUtil(this.ref);
  }

  public firestore(): FirebaseFirestore.Firestore {
    return firestore;
  }

  async add(key: string, value: T): Promise<FirebaseFirestore.WriteResult> {
    if (isNil(key) || isNil(value)) {
      throw new Error('key or value is undefined' + key + value);
    }
    if (WHAT_IF) {
      return this.logger.log('add', this.collection, key, value);
    }
    return await this.ref.doc(key).set(value);
  }

  async get(): Promise<any> {
    return await this.ref.get()
      .then(snapshot => {
        const result = {};
        snapshot.forEach(doc => {
          result[doc.id] = doc.data();
        });
        return result;
      });
  }

  async remove(key: string): Promise<void> {
    if (isNil(key)) {
      throw new Error('key is undefined' + key);
    }

    if (WHAT_IF) {
      return this.logger.log('remove', this.collection, key);
    }

    await this.ref.doc(key).delete();
  }

  async geoQuery(center: GeoPoint, radiusKm: number = 15, field: string = 'location.geopoint'): Promise<any> {
    const result = await this.geoFireUtil.getLocations({ center, radius: radiusKm } as GeoQueryArea, field);
    this.logger.log('Items found:', result.length);
    return result;
  }

}

@singleton()
export class FirebaseClient {
  private readonly logger: Logger = new Logger(this);
  public posts: GenericFirebase<InstaPost> = new GenericFirebase('posts');
  public tags: GenericFirebase<any> = new GenericFirebase('tags');
  public locations: GenericFirebase<any> = new GenericFirebase('locations');
  public users: GenericFirebase<any> = new GenericFirebase('users');
}

