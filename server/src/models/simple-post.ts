
export interface SimplePostUser {
    name: string;
    full_name: string;
    pic: string;
}

export interface SimplePost {
    code: string;
    caption: string;
    location: SimpleLocation;
    user: SimplePostUser;
    [otherParams: string]: any;
}

export interface SimpleLocation {
    latitude: number;
    longitude: number;
}