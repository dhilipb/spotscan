import { Component, ViewChild } from '@angular/core';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { InstaPost } from '@shared/models';
import { get } from 'lodash';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ApiService } from './services';

@Component({
  selector: 'ss-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  @ViewChild(GoogleMap) googleMap: GoogleMap;
  @ViewChild(MapInfoWindow, { static: false }) infoWindow: MapInfoWindow;

  private mapCenter$: Subject<google.maps.LatLng> = new Subject();

  public loading: boolean = false;

  // Markers
  posts: InstaPost[] = [];
  selectedPost: InstaPost;

  public defaultOptions = {
    center: { lat: 51.50178854430209, lng: -0.1287789730673694 },
    zoom: 14,
  };

  constructor(
    private apiService: ApiService
  ) {
    this.mapCenter$.pipe(debounceTime(500)).subscribe((center: google.maps.LatLng) => {
      this.retrievePosts(center);
    });
    this.retrievePosts(new google.maps.LatLng(this.defaultOptions.center.lat, this.defaultOptions.center.lng));
  }

  mapChange() {
    if (this.googleMap) {
      const center = this.googleMap.getCenter();
      this.mapCenter$.next(center);
    }
  }

  openInfoWindow(markerAnchor: MapMarker, post: InstaPost) {
    this.selectedPost = post;
    console.log(this.selectedPost);
    this.infoWindow.open(markerAnchor);
  }

  private retrievePosts(center: google.maps.LatLng) {
    this.loading = true;
    this.apiService.getMarkers(center.lat(), center.lng()).subscribe(posts => {
      this.loading = false;
      this.updatePosts(posts);
    });
  }

  closeInfoWindow() {
    this.infoWindow.close();
  }

  deleteMarker(post: InstaPost) {
    if (post.code) {
      this.apiService.deleteMarker(post.code).subscribe(() => {
        const index = this.posts.findIndex(postX => postX.code === post.code);
        this.posts.splice(index, 1);
      });
    }
  }

  discover(event) {
    const latitude = event.latLng.lat();
    const longitude = event.latLng.lng();
    console.log(event);
    this.loading = true;
    this.apiService.discoverSpot(latitude, longitude).subscribe(posts => {
      this.loading = false;
      this.updatePosts(posts);
    });
  }

  scrape(event) {
    if (event.keyCode === 13) {
      const text: string = event.target.value;
      if (text.startsWith('#')) {
        this.apiService.discoverHashtag(text.substr(1)).subscribe();
      } else if (text.startsWith('@')) {
        this.apiService.discoverUser(text.substr(1)).subscribe();
      } else {
        this.apiService.discoverUser(text).subscribe();
      }
      event.target.value = '';
    }
  }

  private updatePosts(posts: InstaPost[]) {
    posts.forEach(post => {
      const alreadyExists = this.posts.find(postInLoop => postInLoop.code === post.code);
      if (!alreadyExists) {

        // Marker options
        post.markerOptions = {
          position: {
            lat: get(post, 'location[0]'),
            lng: get(post, 'location[1]')
          },
          draggable: false
        } as google.maps.MarkerOptions;
        this.posts.push(post);
      }
    });
  }

}
