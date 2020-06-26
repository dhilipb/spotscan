import { Component, ViewChild } from '@angular/core';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { last } from 'lodash';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { InstaPost } from './models/simple-post';
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

  // Markers
  posts: InstaPost[] = [];
  selectedPost: InstaPost;

  public defaultOptions = {
    center: { lat: 51.41453970160687, lng: -0.6819629031785168 },
    zoom: 10,
  };

  constructor(
    private apiService: ApiService
  ) {
    this.mapCenter$.pipe(debounceTime(500)).subscribe((center: google.maps.LatLng) => {
      this.retrievePosts(center);
    });
    this.retrievePosts(new google.maps.LatLng(this.defaultOptions.center.lat, this.defaultOptions.center.lng));
  }

  mapDragend() {
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

  private getIconUrl(post: InstaPost): string {
    const images = post?.image_versions2?.candidates || [];
    const lastImage = last(images);
    return lastImage?.url || '';
  }

  private retrievePosts(center: google.maps.LatLng) {
    this.apiService.getMarkers(center.lat(), center.lng()).subscribe(posts => {
      posts.forEach(post => {
        const alreadyExists = this.posts.find(postInLoop => postInLoop.code === post.code);
        if (!alreadyExists) {
          post.markerOptions = {
            position: {
              lat: post?.location.geopoint._latitude,
              lng: post?.location.geopoint._longitude
            },
            // icon: {
            //   scaledSize: {
            //     width: 50,
            //     height: 50
            //   },
            //   url: this.getIconUrl(post)
            // },
            draggable: false
          } as google.maps.MarkerOptions;
          this.posts.push(post);
        }
      });
    });
  }

}
