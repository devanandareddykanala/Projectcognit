declare module "leaflet" {
  export interface MapOptions {}
  export interface TileLayerOptions {}
  export interface GeoJSONOptions {
    style?: object;
  }
  export interface LayerGroup {
    clearLayers(): this;
    addTo(target: Map | LayerGroup): this;
  }
  export interface Layer {
    on(event: string, fn: () => void): this;
    addTo(target: Map | LayerGroup): this;
  }
  export interface Map {
    setView(center: [number, number], zoom: number): this;
    remove(): void;
  }
  export interface TileLayer extends Layer {}
  export interface GeoJSON extends Layer {}
  export interface IconDefaultPrototype {
    _getIconUrl?: unknown;
  }
  export interface IconDefault {
    prototype: IconDefaultPrototype;
    mergeOptions(opts: object): void;
  }
  export const Icon: { Default: IconDefault };
  export function map(el: HTMLElement, options?: MapOptions): Map;
  export function tileLayer(url: string, options?: TileLayerOptions): TileLayer;
  export function layerGroup(): LayerGroup;
  export function geoJSON(data: unknown, options?: GeoJSONOptions): GeoJSON;
}

declare module "leaflet/dist/leaflet.css" {}
