import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { InstaPost } from '@shared/models';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private httpClient: HttpClient
  ) { }

  public getMarkers(latitude: number | string, longitude: number | string): Observable<InstaPost[]> {
    return this.httpClient.get<InstaPost[]>(`/api/markers/${latitude}/${longitude}`);
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
