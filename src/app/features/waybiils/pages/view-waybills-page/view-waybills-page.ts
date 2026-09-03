import {Component, computed, OnInit, OnDestroy, signal} from '@angular/core';
import {ItemWaybill} from '../../component/item-waybill/item-waybill';
import {DateFilter} from '../../component/date-filter/date-filter';
import {NgForOf, NgIf} from '@angular/common';
import {Calendar} from '../../component/calendar/calendar';
import {_WayBill} from '../../../../../interfaces';
import {VehicleFleetService} from '../../../../core/services/vehicle-fleet.service';
import {WaybillsService} from '../../services/waybills.service';
import {DateFilterService} from '../../services/date-filter.service';
import {AlertService} from '../../../../core/services/alert.service';
import {Router} from '@angular/router';


@Component({
  selector: 'app-view-waybills-page',
  imports: [ItemWaybill, DateFilter, NgForOf, NgIf, Calendar],
  templateUrl: './view-waybills-page.html',
  styleUrl: './view-waybills-page.css',
})
export class ViewWaybillsPage implements OnInit, OnDestroy {
  vehicleFleetList: { trucks: any[]; trailers: any[] } = {trucks: [], trailers: []};

  selectedMonth = signal<number | null>(null);

  enrichedWaybills = computed<_WayBill[]>(() =>
    this.waybillsService.waybills().map((bill) => {
      if (!bill.dataFinish) return bill;
      const start = new Date(bill.dataStart);
      const finish = new Date(bill.dataFinish);
      const diffHrs = (finish.getTime() - start.getTime()) / (1000 * 60 * 60);
      const hours = Math.floor(diffHrs);
      const minutes = Math.floor((diffHrs - hours) * 60);
      const tripTime = `${hours}h ${minutes}m`;
      const billableDays = diffHrs <= 12 ? 0.5 : diffHrs <= 24 ? 1 : Math.ceil(diffHrs / 12) * 0.5;
      const month = start.getMonth();
      return {...bill, tripTime, billableDays, month};
    }),
  );

  filteredWaybills = computed<_WayBill[]>(() => {
    const month = this.dateFilterService.currentSelectedMonth();
    const year = this.dateFilterService.currentSelectedYear();
    const day = this.dateFilterService.selectedDay();
    const range = this.dateFilterService.selectedRange();

    return this.enrichedWaybills()
      .filter((b) => {
        const start = new Date(b.dataStart);
        const finish = new Date(b.dataFinish || b.dataStart);

        // Normalize dates for comparison
        start.setHours(0, 0, 0, 0);
        finish.setHours(23, 59, 59, 999);

        // If a date range is selected
        if (range) {
          const rangeStart = new Date(range.start);
          const rangeEnd = new Date(range.end);
          rangeStart.setHours(0, 0, 0, 0);
          rangeEnd.setHours(23, 59, 59, 999);

          // Check if waybill overlaps with the selected range
          return start <= rangeEnd && finish >= rangeStart;
        }

        // If a single day is selected
        if (day) {
          const selectedDate = new Date(day.date);
          selectedDate.setHours(0, 0, 0, 0);

          // Waybill must overlap with the selected day
          return start <= selectedDate && finish >= selectedDate;
        }

        // If no specific day selected, show all waybills that overlap with the month/year
        const monthStart = new Date(year, month, 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(year, month + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        // Waybill overlaps with the month if it starts before month ends AND finishes after month starts
        return start <= monthEnd && finish >= monthStart;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dataFinish || a.dataStart).getTime();
        const dateB = new Date(b.dataFinish || b.dataStart).getTime();
        return dateA - dateB;
      });
  });

  totalTime = computed(() =>
    this.filteredWaybills().reduce((total, item) => total + (item.billableDays ?? 0), 0),
  );

  constructor(
    private vehicleFleetService: VehicleFleetService,
    protected waybillsService: WaybillsService,
    private dateFilterService: DateFilterService,
    private alert: AlertService,
    private router: Router,
  ) {
  }

  async ngOnInit() {
    try {
      this.waybillsService.startRealtimeSync();
      await this.loadFleet();
      this.selectedMonth.set(this.dateFilterService.currentSelectedMonth());
    } catch (err) {
      console.error(err);
      this.alert.show('error', 'Failed to load waybills or fleet');
    }
  }

  ngOnDestroy(): void {
    this.waybillsService.stopRealtimeSync();
  }

  async loadFleet() {
    const fleet = await this.vehicleFleetService.loadVehicleFleet();
    fleet.forEach((v) =>
      v.type === 'truck'
        ? this.vehicleFleetList.trucks.push(v)
        : this.vehicleFleetList.trailers.push(v),
    );
  }

  filterByRange(day: any) {
    if (!day) return;
    this.dateFilterService.selectedDay.set(day);
  }

  onMonthChanged(month: number) {
    this.selectedMonth.set(month);
    this.dateFilterService.selectedDay.set(null);
  }

  addNewWaybill() {
    this.router.navigate(['app', 'waybill-new', 'add']);
  }

  protected getReport() {
    this.waybillsService.isReportOpen.set(!this.waybillsService.isReportOpen());
  }
}
