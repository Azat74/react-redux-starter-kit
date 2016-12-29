import * as React from 'react';
import * as block from 'bem-cn';
import { google } from 'google-maps';
import MapOptions = google.maps.MapOptions;
import * as s from './GoogleMap.styl';
import LatLng = google.maps.LatLng;
import GCRequest = google.maps.GeocoderRequest;
import GCResult = google.maps.GeocoderResult;
import GCStatus = google.maps.GeocoderStatus;
import GCAddressComponent = google.maps.GeocoderAddressComponent;

interface IProps {
  lat?: number;
  lng?: number;
  showNewPoint: boolean;
  onLocationSelected?: (location: Location) => void;
}

type Location = {
  locality: string;
  area: string;
  point: LatLng | null;
};

class GoogleMap extends React.Component<IProps, null> {
  public static defaultProps: IProps = {
    lat: 6.991815,
    lng: 81.055025,
    showNewPoint: true,
  };
  private b = block('google-map');
  private map: google.maps.Map | null;
  private geocoder: google.maps.Geocoder | null;
  private mapContainer: Element;

  public componentWillReceiveProps(nextProps: IProps) {
    const isNew: boolean = nextProps.lat !== this.props.lat || nextProps.lng !== this.props.lng;
    const isNumbers: boolean = typeof nextProps.lat === 'number' && typeof nextProps.lng === 'number';

    if (isNumbers && isNew && nextProps.showNewPoint) {
      this.setPoint(nextProps.lat as number, nextProps.lng as number);
    }
  }

  public setPoint(lat: number, lng: number) {
    const point: LatLng = new LatLng(lat, lng);

    if (this.map !== null) {
      this.map.setCenter(point);
      this.map.setZoom(14);
    }
  }

  public componentWillUnmount() {
    this.map = null;
    this.geocoder = null;
  }

  public componentDidMount() {
    const lat: number = this.props.lat as number;
    const lng: number = this.props.lng as number;

    const options: MapOptions = {
      center: { lat, lng },
      zoom: 8,
    };

    this.geocoder = new google.maps.Geocoder();
    this.map = new google.maps.Map(this.mapContainer, options);
    this.map.addListener('dragend', this.onDragEnd);
  }

  public render() {
    const b = this.b;
    return (
      <div className={s[b()]}>
        <div className={s[b('map')()]} ref={this.onMapRef} />
      </div>
    );
  }

  private onDragEnd = () => {
    if (this.map && this.geocoder) {
      const location: LatLng = this.map.getCenter();
      const request: GCRequest = { location };
      this.geocoder.geocode(request, this.onPlaceDecoded);
    }
  }

  private findAddressComponent(components: GCAddressComponent[], type: string): GCAddressComponent | undefined {
    return components.find(
      (component: GCAddressComponent) => component.types.includes(type),
    );
  }

  private onPlaceDecoded = (results: GCResult[] | null): void => {
    const result: GCResult | null = results && results.length ? results[0] : null;

    if (result) {
      const locality: GCAddressComponent | undefined = this.findAddressComponent(
        result.address_components,
        'locality',
      );
      const administrativeArea: GCAddressComponent | undefined = this.findAddressComponent(
        result.address_components,
        'administrative_area_level_2',
      );
      const newLocation: Location = {
        locality: locality ? locality.long_name : '',
        area: administrativeArea ? administrativeArea.long_name : '',
        point: this.map ? this.map.getCenter() : null,
      };

      const handler = this.props.onLocationSelected;

      if (handler) {
        handler(newLocation);
      }
    }
  }

  private onMapRef = (map: Element) => {
    this.mapContainer = map;
  }

}

export { IProps, Location };
export default GoogleMap;