import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrafficService, RoadId, TrafficCategory, TrafficItem } from '../../core/services/traffic.service';

@Component({
  selector: 'app-traffic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './traffic.html',
  styleUrls: ['./traffic.css'],
})
export class TrafficComponent implements OnInit {
  roads: { id: RoadId; label: string; desc: string }[] = [
    { id: 'ALL', label: 'Wszystkie', desc: 'A2, A12, A30, A10' },
    { id: 'A2', label: 'A2', desc: 'Berlin - Hannover - Ruhrgebiet' },
    { id: 'A12', label: 'A12', desc: 'Świecko (PL) - Berlin' },
    { id: 'A30', label: 'A30', desc: 'Bad Oeynhausen - Osnabrück - NL' },
    { id: 'A10', label: 'A10', desc: 'Berliner Ring' },
  ];

  categories: { id: TrafficCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Wszystko', icon: '📋' },
    { id: 'warning', label: 'Korki i Zatory', icon: '🚨' },
    { id: 'closure', label: 'Zamknięcia dróg', icon: '⛔' },
    { id: 'roadworks', label: 'Roboty drogowe', icon: '🚧' },
  ];

  searchInputValue = '';

  constructor(public trafficService: TrafficService) {}

  ngOnInit(): void {
    if (this.trafficService.items().length === 0) {
      this.trafficService.fetchTrafficData();
    }
  }

  selectRoad(road: RoadId): void {
    this.trafficService.setRoad(road);
  }

  selectCategory(cat: TrafficCategory): void {
    this.trafficService.setCategory(cat);
  }

  onSearchChange(): void {
    this.trafficService.setSearchQuery(this.searchInputValue);
  }

  clearSearch(): void {
    this.searchInputValue = '';
    this.trafficService.setSearchQuery('');
  }

  refresh(): void {
    this.trafficService.fetchTrafficData(true);
  }

  openAdac(road?: string): void {
    const targetRoad = road && road !== 'ALL' ? road : this.trafficService.selectedRoad();
    const r = targetRoad === 'ALL' ? 'A2' : targetRoad;
    const url = this.trafficService.getAdacUrl(r);
    window.open(url, '_blank');
  }

  openMaps(item: TrafficItem): void {
    if (item.googleMapsUrl) {
      window.open(item.googleMapsUrl, '_blank');
    }
  }

  formatTime(isoString?: string): string {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  formatLastUpdated(d: Date | null): string {
    if (!d) return 'Brak danych';
    return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  }
}
