import { Injectable, signal, computed } from '@angular/core';

export type RoadId = 'ALL' | 'A2' | 'A12' | 'A30' | 'A10';
export type TrafficCategory = 'all' | 'warning' | 'closure' | 'roadworks';

export interface TrafficCoordinate {
  lat: number | string;
  long: number | string;
}

export interface TrafficItem {
  id: string;
  road: string;
  type: 'WARNING' | 'CLOSURE' | 'ROADWORKS';
  title: string;
  subtitle?: string;
  description: string[];
  startTimestamp?: string;
  delayMinutes?: number;
  averageSpeed?: number;
  trafficType?: string;
  isBlocked?: boolean;
  coordinate?: TrafficCoordinate;
  icon?: string;
  adacUrl: string;
  googleMapsUrl?: string;
}

export interface RoadSummary {
  road: string;
  warningCount: number;
  closureCount: number;
  roadworksCount: number;
  totalDelayMinutes: number;
}

@Injectable({ providedIn: 'root' })
export class TrafficService {
  readonly ROADS: RoadId[] = ['A2', 'A12', 'A30', 'A10'];
  private readonly BASE_API = 'https://verkehr.autobahn.de/o/autobahn';
  private readonly CACHE_KEY = 'traffic_data_cache';
  private readonly CACHE_TIME_KEY = 'traffic_data_cache_time';

  // Signals
  items = signal<TrafficItem[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  lastUpdated = signal<Date | null>(null);
  selectedRoad = signal<RoadId>('ALL');
  selectedCategory = signal<TrafficCategory>('all');
  searchQuery = signal<string>('');

  // Summaries per road
  roadSummaries = computed<Record<string, RoadSummary>>(() => {
    const all = this.items();
    const result: Record<string, RoadSummary> = {};

    for (const r of this.ROADS) {
      if (r === 'ALL') continue;
      const roadItems = all.filter((i) => i.road === r);
      const warnings = roadItems.filter((i) => i.type === 'WARNING');
      const closures = roadItems.filter((i) => i.type === 'CLOSURE');
      const roadworks = roadItems.filter((i) => i.type === 'ROADWORKS');
      const totalDelay = warnings.reduce((acc, curr) => acc + (curr.delayMinutes || 0), 0);

      result[r] = {
        road: r,
        warningCount: warnings.length,
        closureCount: closures.length,
        roadworksCount: roadworks.length,
        totalDelayMinutes: totalDelay,
      };
    }

    return result;
  });

  // Total summary stats
  totalStats = computed(() => {
    const all = this.items();
    const warnings = all.filter((i) => i.type === 'WARNING');
    const closures = all.filter((i) => i.type === 'CLOSURE');
    const roadworks = all.filter((i) => i.type === 'ROADWORKS');
    const totalDelay = warnings.reduce((acc, curr) => acc + (curr.delayMinutes || 0), 0);

    return {
      totalWarnings: warnings.length,
      totalClosures: closures.length,
      totalRoadworks: roadworks.length,
      totalDelays: totalDelay,
    };
  });

  // Filtered items signal
  filteredItems = computed(() => {
    let result = this.items();
    const road = this.selectedRoad();
    const cat = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();

    if (road !== 'ALL') {
      result = result.filter((i) => i.road === road);
    }

    if (cat === 'warning') {
      result = result.filter((i) => i.type === 'WARNING');
    } else if (cat === 'closure') {
      result = result.filter((i) => i.type === 'CLOSURE');
    } else if (cat === 'roadworks') {
      result = result.filter((i) => i.type === 'ROADWORKS');
    }

    if (query) {
      result = result.filter((i) => {
        const titleMatch = i.title?.toLowerCase().includes(query);
        const subMatch = i.subtitle?.toLowerCase().includes(query);
        const descMatch = i.description?.some((d) => d.toLowerCase().includes(query));
        const roadMatch = i.road.toLowerCase().includes(query);
        return titleMatch || subMatch || descMatch || roadMatch;
      });
    }

    // Sort by delay time desc, then warning first, then timestamp
    return result.sort((a, b) => {
      if ((b.delayMinutes || 0) !== (a.delayMinutes || 0)) {
        return (b.delayMinutes || 0) - (a.delayMinutes || 0);
      }
      if (a.type === 'WARNING' && b.type !== 'WARNING') return -1;
      if (b.type === 'WARNING' && a.type !== 'WARNING') return 1;
      return (b.startTimestamp || '').localeCompare(a.startTimestamp || '');
    });
  });

  constructor() {
    this.loadFromCache();
    this.fetchTrafficData();
  }

  getAdacUrl(road: string): string {
    const r = road.toUpperCase();
    return `https://www.adac.de/verkehr/verkehrsinformationen/de/${r.toLowerCase()}/?country=D&federalState=&street=${r}&streetType=Highway&showConstructionSites=false&pageNumber=1&submit=false&resetSearchParams=false`;
  }

  setRoad(road: RoadId) {
    this.selectedRoad.set(road);
  }

  setCategory(cat: TrafficCategory) {
    this.selectedCategory.set(cat);
  }

  setSearchQuery(q: string) {
    this.searchQuery.set(q);
  }

  private loadFromCache() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      const time = localStorage.getItem(this.CACHE_TIME_KEY);
      if (cached) {
        this.items.set(JSON.parse(cached));
      }
      if (time) {
        this.lastUpdated.set(new Date(parseInt(time, 10)));
      }
    } catch (e) {
      console.warn('Could not load traffic cache:', e);
    }
  }

  private saveToCache(data: TrafficItem[]) {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(this.CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Could not save traffic to cache:', e);
    }
  }

  async fetchTrafficData(force = false): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);

    const roadsToFetch: RoadId[] = ['A2', 'A12', 'A30', 'A10'];
    const collected: TrafficItem[] = [];

    try {
      await Promise.all(
        roadsToFetch.map(async (road) => {
          // 1. Fetch warnings (traffic jams, accidents, hazards)
          try {
            const res = await fetch(`${this.BASE_API}/${road}/services/warning`);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data?.warning)) {
                for (const w of data.warning) {
                  collected.push(this.transformItem(w, road, 'WARNING'));
                }
              }
            }
          } catch (err) {
            console.warn(`Error fetching warnings for ${road}:`, err);
          }

          // 2. Fetch closures
          try {
            const res = await fetch(`${this.BASE_API}/${road}/services/closure`);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data?.closure)) {
                for (const c of data.closure) {
                  collected.push(this.transformItem(c, road, 'CLOSURE'));
                }
              }
            }
          } catch (err) {
            console.warn(`Error fetching closures for ${road}:`, err);
          }

          // 3. Fetch roadworks
          try {
            const res = await fetch(`${this.BASE_API}/${road}/services/roadworks`);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data?.roadworks)) {
                for (const rw of data.roadworks) {
                  collected.push(this.transformItem(rw, road, 'ROADWORKS'));
                }
              }
            }
          } catch (err) {
            console.warn(`Error fetching roadworks for ${road}:`, err);
          }
        }),
      );

      if (collected.length > 0) {
        this.items.set(collected);
        this.saveToCache(collected);
        this.lastUpdated.set(new Date());
      }
    } catch (error: any) {
      console.error('Failed to fetch traffic data:', error);
      this.error.set(error?.message || 'Błąd pobierania danych o ruchu.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private transformItem(raw: any, road: string, type: 'WARNING' | 'CLOSURE' | 'ROADWORKS'): TrafficItem {
    let descLines: string[] = [];
    if (Array.isArray(raw.description)) {
      descLines = raw.description.filter((l: any) => typeof l === 'string' && l.trim().length > 0);
    } else if (typeof raw.description === 'string') {
      descLines = raw.description.split('\n').filter((l: string) => l.trim().length > 0);
    }

    const delayMinutes = raw.delayTimeValue ? parseInt(raw.delayTimeValue, 10) : undefined;
    const averageSpeed = raw.averageSpeed ? parseInt(raw.averageSpeed, 10) : undefined;

    let googleMapsUrl: string | undefined;
    if (raw.coordinate?.lat && raw.coordinate?.long) {
      googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${raw.coordinate.lat},${raw.coordinate.long}`;
    }

    return {
      id: raw.identifier || `${road}-${type}-${Math.random()}`,
      road,
      type,
      title: raw.title || `${road} Informacja o ruchu`,
      subtitle: raw.subtitle?.trim() || undefined,
      description: descLines,
      startTimestamp: raw.startTimestamp || undefined,
      delayMinutes,
      averageSpeed,
      trafficType: raw.abnormalTrafficType || undefined,
      isBlocked: raw.isBlocked === 'true' || raw.isBlocked === true,
      coordinate: raw.coordinate
        ? { lat: raw.coordinate.lat, long: raw.coordinate.long }
        : undefined,
      icon: raw.icon || undefined,
      adacUrl: this.getAdacUrl(road),
      googleMapsUrl,
    };
  }
}
