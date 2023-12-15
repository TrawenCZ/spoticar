export type EmptyResponse = {};
export type EmptyRequest = {};

export type AvailableDevicesResponse = {
  devices: {
    id: string;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
    volume_percent: number;
    supports_volume: boolean;
  }[];
};

export type TransferPlaybackRequest = { device_ids: string[]; play: boolean };

export type SearchResponse = {
  tracks: {
    href: string;
    items: {
      album: {
        album_type: string;
        artists: {
          external_urls: { spotify: string };
          href: string;
          id: string;
          name: string;
          type: string;
          uri: string;
        }[];
        available_markets: string[];
        external_urls: { spotify: string };
        href: string;
        id: string;
        images: {
          height: number;
          url: string;
          width: number;
        }[];
        name: string;
        release_date: string;
        release_date_precision: string;
        total_tracks: number;
        type: string;
        uri: string;
      };
      artists: {
        external_urls: { spotify: string };
        href: string;
        id: string;
        name: string;
        type: string;
        uri: string;
      }[];
      available_markets: string[];
      disc_number: number;
      duration_ms: number;
      explicit: boolean;
      external_ids: { isrc: string };
      external_urls: { spotify: string };
      href: string;
      id: string;
      is_local: boolean;
      name: string;
      popularity: number;
      preview_url: string;
      track_number: number;
      type: string;
      uri: string;
    }[];
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
  };
};
