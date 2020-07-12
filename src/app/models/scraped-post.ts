
export interface ScrapedPostDto {
  code: string;
  images: string[];
  location: [number, number];
  caption: string;
  username: string;
  like_count: number;
  taken_at: number;
  markerOptions?: google.maps.MarkerOptions;
}
