import { Component, OnInit } from '@angular/core';
import {
  AvailableCapacityService,
  TruckType,
} from '../../core/services/available-capacity.service';
import { NgForOf } from '@angular/common';
import { ModalService } from '../../core/services/modal.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-available-capacity',
  imports: [NgForOf],
  templateUrl: './available-capacity.html',
  styleUrl: './available-capacity.css',
})
export class AvailableCapacity implements OnInit {
  private readonly STORAGE_KEY = 'selectedTruckType';
  selectedType: TruckType = (localStorage.getItem(this.STORAGE_KEY) as TruckType) || 'TIR';
  truckData: any;

  constructor(
    protected availableCapacityService: AvailableCapacityService,
    public modalService: ModalService,
    private router: Router,
  ) {
    this.ngOnInit();
  }
  ngOnInit() {
    this.loadSelectedType();
    this.onSelect(this.selectedType);
    this.isActive();
  }

  isActive() {
    const btn = document.getElementById(this.selectedType.toLowerCase());
    document.querySelectorAll('.select-btn').forEach((el) => el.classList.remove('active'));
    btn?.classList.add('active');
  }

  palletKeys(): string[] {
    return Object.keys(this.truckData.Pallets);
  }

  onSelect(type: TruckType) {
    this.selectedType = type;
    this.saveSelectedType();
    this.isActive();
    this.truckData = this.availableCapacityService.getTruck(type);
  }

  protected openEdit() {
    this.router.navigate(['app/available-capacity-edit', this.selectedType]);
  }

  // ===============================
  // Save selected type to localStorage
  // ===============================
  private saveSelectedType() {
    localStorage.setItem(this.STORAGE_KEY, this.selectedType);
  }

  // ===============================
  // Load selected type from localStorage
  // ===============================
  private loadSelectedType() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved && ['TIR', 'SOLO', 'TRAILER'].includes(saved)) {
      this.selectedType = saved as TruckType;
    }
  }
}
