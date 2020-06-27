import { LocationFeedResponseMedia, TagFeedResponseItemsItem } from 'instagram-private-api';
import { has, keys } from 'lodash';
import { injectable } from 'tsyringe';

import { FirebaseClient, InstagramClient, Logger } from './helpers';
import { InstagramUtil } from './instagram-util';
import { SimplePost, UserFeedResponseItem } from './models';


@injectable()
export class ScraperUtil {
	private readonly logger: Logger = new Logger(this);

	constructor(
		private instagram: InstagramClient,
		private firebaseClient: FirebaseClient
	) { }

	public transformPost(post: UserFeedResponseItem | TagFeedResponseItemsItem | LocationFeedResponseMedia | LocationFeedResponseMedia): SimplePost {
		if (!has(post, 'location')) {
			return null;
		}
		if (!has(post, 'image_versions2.candidates[0].url')) {
			return null;
		}

		const simplifiedPost = {
			...post,
			code: post.code,
			caption: post.caption?.text || '',
			location: { latitude: +post.location.lat, longitude: +post.location.lng },
			user: {
				name: post.user.username,
				full_name: post.user.full_name,
				pic: post.user.profile_pic_url,
			},
		};

		return simplifiedPost;
	}

	async storePosts(posts: SimplePost[]): Promise<void> {
		const storedPosts = (await this.firebaseClient.posts.get()) || {};
		for (const post of posts) {
			const isInFirebase = Object.keys(storedPosts).includes(post.code);
			if (isInFirebase) {
				this.logger.log(`${post.code} already exists`);
				continue;
			}
			await this.firebaseClient.posts.add(post.code, post);
		}
	}

	async getByUser(user: string): Promise<UserFeedResponseItem[]> {
		this.logger.log(user, 'getByUser');
		const account = await this.instagram.client.user.searchExact(user);
		if (account) {
			const feed = await this.instagram.feed.user(account.pk);

			// Get pages to scrape
			let pagesToScrape = 5;
			const usersScraped = (await this.firebaseClient.users.get()) || {};
			await this.firebaseClient.users.add(user, { lastScraped: new Date(), ...account });
			if (!user.includes(keys(usersScraped))) {
				pagesToScrape = 1;
			}

			const posts: UserFeedResponseItem[] = [];
			for (let i = 0; i < pagesToScrape; i++) {
				posts.push(...(await feed.items() as UserFeedResponseItem[]));
			};
			const filteredPosts = posts.filter(InstagramUtil.isValidImage);
			this.logger.log(user, 'Retrieved', filteredPosts.length, 'items');
			return filteredPosts;
		}

		return [];
	}

	async getByHashtag(hashtag: string): Promise<TagFeedResponseItemsItem[]> {
		this.logger.log(hashtag, 'getByHashtag');
		const feed = await this.instagram.feed.tags(hashtag, 'top');

		// Get pages to scrape
		let pagesToScrape = 5;
		const tagsScraped = (await this.firebaseClient.tags.get()) || {};
		await this.firebaseClient.tags.add(hashtag, { lastScraped: new Date() });
		if (!hashtag.includes(keys(tagsScraped))) {
			pagesToScrape = 1;
		}

		const posts: TagFeedResponseItemsItem[] = [];
		for (let i = 0; i < pagesToScrape; i++) {
			posts.push(...(await feed.items() as TagFeedResponseItemsItem[]));
		};
		const filteredPosts = posts.filter(post => InstagramUtil.isValidImage(post) && InstagramUtil.hasHighLikeCount(post));
		this.logger.log(hashtag, 'Retrieved', filteredPosts.length, 'items');
		return filteredPosts;
	}

	async getByLocation(locationId: string): Promise<LocationFeedResponseMedia[]> {
		this.logger.log(locationId, 'getByLocation');
		locationId = locationId + '';
		const feed = await this.instagram.feed.location(locationId, 'ranked');

		// Get pages to scrape
		let pagesToScrape = 5;
		const tagsScraped = (await this.firebaseClient.locations.get()) || {};
		await this.firebaseClient.locations.add(locationId, { lastScraped: new Date() });
		if (!locationId.includes(keys(tagsScraped))) {
			pagesToScrape = 1;
		}

		const posts: LocationFeedResponseMedia[] = [];
		for (let i = 0; i < pagesToScrape; i++) {
			posts.push(...(await feed.items() as LocationFeedResponseMedia[]));
		};
		const filteredPosts = posts.filter(post => InstagramUtil.isValidImage(post) && InstagramUtil.hasHighLikeCount(post));
		this.logger.log(locationId, 'Retrieved', filteredPosts.length, 'items');
		return filteredPosts;
	}

}

