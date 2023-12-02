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
