import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import MarkerClusterer from '@google/markerclusterer';
import { get } from 'lodash';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ScrapedPostDto } from './models';
import { ApiService } from './services';

@Component({
  selector: 'ss-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {

  @ViewChild(GoogleMap) googleMap: GoogleMap;
  @ViewChild(MapInfoWindow, { static: false }) infoWindow: MapInfoWindow;
  loading: number = 0;

  // Markers
  posts: ScrapedPostDto[] = [];
  selectedPost: ScrapedPostDto;

  defaultOptions = {
    center: { lat: 51.50178854430209, lng: -0.1287789730673694 },
    zoom: 14,
  };
  statusMessage: string;

  private mapCenter$: Subject<google.maps.LatLng> = new Subject();
  private markerCluster: MarkerClusterer;
  private markerClusterOptions = { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' };

  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit() { }

  ngAfterViewInit(): void {
    // this.markerCluster = new MarkerClusterer(this.googleMap._googleMap, this.posts, this.markerClusterOptions);
    this.mapCenter$.pipe(debounceTime(500)).subscribe((center: google.maps.LatLng) => {
      this.retrieveMarkers(center);
    });
    this.retrieveMarkers(new google.maps.LatLng(this.defaultOptions.center.lat, this.defaultOptions.center.lng));

  }

  mapChange() {
    if (this.googleMap) {
      const center = this.googleMap.getCenter();
      this.statusMessage = this.googleMap.getZoom() < 10 ? 'Please zoom in to see more' : '';
      this.mapCenter$.next(center);
    }
  }

  openInfoWindow(markerAnchor: MapMarker, post: ScrapedPostDto) {
    this.selectedPost = post;
    this.infoWindow.open(markerAnchor);
  }

  closeInfoWindow() {
    this.infoWindow.close();
  }

  deleteMarker(post: ScrapedPostDto) {
    if (post.code) {
      this.loading++;
      this.apiService.deleteMarker(post.code).subscribe(response => {
        this.loading--;
        if (get(response, 'success')) {
          const index = this.posts.findIndex(postX => postX.code === post.code);
          this.posts.splice(index, 1);
        }
      });
    }
  }

  discover(event) {
    this.loading++;
    this.apiService.discoverSpot(event.latLng.lat(), event.latLng.lng()).subscribe(posts => {
      this.loading--;
      this.updatePosts(posts, 'https://i.imgur.com/fn3w5G8.png');
    });
  }

  private updatePosts(posts: ScrapedPostDto[], iconUrl?: string) {
    posts.forEach(post => {
      const alreadyExists = this.posts.find(postInLoop => postInLoop.code === post.code);
      if (!alreadyExists) {

        // Marker options
        iconUrl = post.username === 'londonunmasked' && window.location.href.includes('londonunmasked') ? 'https://i.imgur.com/yHw9r5X.png' : (iconUrl || 'https://i.imgur.com/bsT8OCA.png');
        post.markerOptions = {
          position: new google.maps.LatLng(get(post, 'location[0]'), get(post, 'location[1]')),
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(32, 32)
          } as google.maps.Icon,
          draggable: false
        } as google.maps.MarkerOptions;

        this.posts.push(post);
        // this.markerCluster.addMarker(new google.maps.Marker({
        //   position: post.markerOptions.position,
        //   icon: post.markerOptions.icon
        // }));
      }
    });


  }

  private retrieveMarkers(center: google.maps.LatLng) {
    this.loading++;
    this.apiService.getMarkers(center.lat(), center.lng(), this.googleMap.getZoom()).subscribe(posts => {
      this.loading--;
      this.updatePosts(posts);
    });
  }

}
