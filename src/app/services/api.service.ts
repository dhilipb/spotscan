import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { InstaPost } from '../models/simple-post';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly BASE = 'http://localhost:3000';

  constructor(
    private httpClient: HttpClient
  ) { }

  public getMarkers(latitude: number | string, longitude: number | string): Observable<InstaPost[]> {
    return this.httpClient.get<InstaPost[]>(this.BASE + `/markers/${latitude}/${longitude}`);
  }

  public deleteMarker(markerCode: string): Observable<any> {
    return this.httpClient.delete(this.BASE + `/markers/${markerCode}`);
  }

  public discoverSpot(latitude: number, longitude: number): Observable<any> {
    return this.httpClient.get(this.BASE + `/discover/location/${latitude}/${longitude}`);
  }

}
