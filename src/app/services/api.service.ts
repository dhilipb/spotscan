import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ScrapedPostDto } from '../models';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private httpClient: HttpClient
  ) { }

  public getMarkers(latitude: string, longitude: string, zoom: string): Observable<ScrapedPostDto[]> {
    return this.httpClient.get<ScrapedPostDto[]>('/api/markers', {
      params: { latitude, longitude, zoom }
    });
  }

  public deleteMarker(markerCode: string): Observable<any> {
    return this.httpClient.delete(`/api/markers/${markerCode}`);
  }

  public discoverSpot(latitude: number, longitude: number): Observable<any> {
    return this.httpClient.get(`/api/discover/location/${latitude}/${longitude}`);
  }
  public discoverUser(username: string): Observable<any> {
    return this.httpClient.get(`/api/discover/user/${username}`);
  }
  public discoverHashtag(tag: string): Observable<any> {
    return this.httpClient.get(`/api/discover/hashtag/${tag}`);
  }

}
