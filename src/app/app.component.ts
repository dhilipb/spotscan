import { Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { ActivatedRoute } from '@angular/router';
import MarkerClusterer from '@google/markerclusterer';
import { get } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ScrapedPostDto } from './models';
import { ApiService } from './services';

@Component({
  selector: 'ss-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild(GoogleMap) googleMap: GoogleMap;
  @ViewChild(MapInfoWindow, { static: false }) infoWindow: MapInfoWindow;
  @ViewChild('contentItems') contentItemsElem;

  loading: number = 0;

  // Markers
  posts: ScrapedPostDto[] = [];
  nearPosts: ScrapedPostDto[] = [];
  selectedPost: ScrapedPostDto;

  defaultOptions: google.maps.MapOptions = {
    center: new google.maps.LatLng(51.50178854430209, -0.1287789730673694),
    zoom: 14,
    clickableIcons: false
  };
  statusMessage: string;

  private mapCenter$: Subject<google.maps.LatLng> = new Subject();
  private markerCluster: MarkerClusterer;
  private markerClusterOptions = { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' };

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.retrieveMarkers(this.defaultOptions.center as google.maps.LatLng);
    this.mapCenter$.pipe(debounceTime(500)).subscribe((center: google.maps.LatLng) => {
      this.retrieveMarkers(center);
    });

    if (window.location.href.includes('admin=')) {
      sessionStorage.setItem('ADMIN', 'true');
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.googleMap.center = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        this.retrieveMarkers(this.googleMap.getCenter());
      });
    }
  }

  mapInit(): void {
    // this.markerCluster = new MarkerClusterer(this.googleMap._googleMap, this.posts, this.markerClusterOptions);
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

  deletePost(post: ScrapedPostDto) {
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

  refreshPost(post: ScrapedPostDto) {
    if (post.code) {
      this.loading++;
      this.apiService.refreshMarker(post.code).subscribe(response => {
        this.loading--;
        if (get(response, 'success')) {
          const index = this.posts.findIndex(postX => postX.code === post.code);
          console.log(response);
          this.posts[index] = response;
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
    this.nearPosts = [];

    posts.forEach(post => {
      // Marker options
      iconUrl = post.username === 'londonunmasked' && window.location.href.includes('londonunmasked') ? 'https://i.imgur.com/yHw9r5X.png' : 'https://i.imgur.com/bsT8OCA.png';
      post.markerOptions = {
        position: new google.maps.LatLng(get(post, 'location[0]'), get(post, 'location[1]')),
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(25, 25)
        } as google.maps.Icon,
        draggable: false
      } as google.maps.MarkerOptions;

      const imageUrl = get(post, 'images[0]', '');
      if (imageUrl.includes('instagram.com')) {
        post.images[0] = '/api/markers/image?image=' + btoa(imageUrl);
      }

      if (this.nearPosts.length < 50) {
        this.nearPosts.push(post);
      }

      const alreadyExists = this.posts.find(postInLoop => postInLoop.code === post.code);
      if (!alreadyExists) {
        this.posts.push(post);
      }
      // this.markerCluster.addMarker(new google.maps.Marker({
      //   position: post.markerOptions.position,
      //   icon: post.markerOptions.icon
      // }));
    });

    this.contentItemsElem.scrollTop = 0;


  }

  private retrieveMarkers(center: google.maps.LatLng) {
    if (!this.googleMap) {
      setTimeout(() => this.retrieveMarkers(center), 1000);
      return;
    }

    this.loading++;

    const bounds = this.googleMap.getBounds();
    let radius = 3000;
    if (bounds && center) {
      const ne = bounds.getNorthEast();
      // Calculate radius (in meters).
      radius = +google.maps.geometry.spherical.computeDistanceBetween(center, ne).toFixed(0);
    }

    const urlSearchParams = new URLSearchParams(window.location.search);
    const user = urlSearchParams.get('user');

    this.apiService.getMarkers(center.lat().toString(), center.lng().toString(), radius.toString(), user).subscribe(posts => {
      this.loading--;
      // this.nearPosts = [];
      this.updatePosts(posts);
      this.discoverMarkers();
    });
  }

  private discoverMarkers() {
    const queryParams = this.route.snapshot.queryParams;
    const discoverValue = get(queryParams, 'discover');
    if (!discoverValue) {
      return;
    }

    this.loading++;
    let discoverApi$: Observable<ScrapedPostDto[]>;
    if (discoverValue.startsWith('@')) {
      discoverApi$ = this.apiService.discoverUser(discoverValue.slice(1))
    } else if (discoverValue.startsWith('$')) {
      discoverApi$ = this.apiService.discoverHashtag(discoverValue.slice(1))
    } else if (discoverValue.includes(',')) {
      const [lat, lng] = discoverValue.split(',');
      discoverApi$ = this.apiService.discoverSpot(lat, lng);
    }

    if (discoverApi$) {
      discoverApi$.subscribe(posts => {
        this.loading--;
      })
    }


  }

}
