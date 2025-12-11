import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe, NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SpinnerComponent } from '../spinner/spinner';

import { FirebaseClientService } from '../../firebase/firebase.service';
import { VehicleFleetService } from '../vehicle-fleet/vehicle-fleet.service';
import { AlertService } from '../../services/alert.service';

import { _WillBill } from '../../data/vehicle-fleet-number';
import { VehicleFleetList } from '../waybill/waybill';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

(pdfMake as any).vfs = pdfFonts.vfs;

@Component({
  selector: 'app-waybill-history',
  standalone: true,
  imports: [DatePipe, RouterLink, FormsModule, NgForOf, NgIf, SpinnerComponent],
  templateUrl: './waybill-history.html',
  styleUrls: ['./waybill-history.css']
})
export class WaybillHistory implements OnInit {

  listWaybill = signal<_WillBill[]>([]);
  filteredWaybills = signal<_WillBill[]>([]);
  selectedMonth = signal<number | null>(null);
  isLoading = signal(true);

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  monthsFromFirebase: number[] = [];
  editId: string | null = null;
  vehicleFleetList: VehicleFleetList = { trucks: [], trailers: [] };


  totalTime = computed(() =>
    this.filteredWaybills().reduce((total, item) => total + (item.billableDays ?? 0), 0)
  );

  constructor(
    private fb: FirebaseClientService,
    private vehicleFleetService: VehicleFleetService,
    private alert: AlertService
  ) {

  }

  async ngOnInit(): Promise<void> {
    await this.prepareData();
  }

  async prepareData() {
    try {
      const res = await this.vehicleFleetService.loadVehicleFleet();
      res.forEach(element => {
        if (element.type === 'truck') {
          this.vehicleFleetList.trucks.push(element);
        } else {
          this.vehicleFleetList.trailers.push(element);
        }
      });

      const waybills = await this.fb.getWillBillsHistory();

      const enriched = waybills.map(bill => {
        const start = new Date(bill.dataStart);
        const finish = new Date(bill.dataFinish);

        const diffHrs = (finish.getTime() - start.getTime()) / (1000 * 60 * 60);
        const hours = Math.floor(diffHrs);
        const minutes = Math.floor((diffHrs - hours) * 60);
        const tripTime = `${hours}h ${minutes}m`;

        const month = start.getMonth();
        if (!this.monthsFromFirebase.includes(month)) {
          this.monthsFromFirebase.push(month);
        }

        const billableDays =
          diffHrs <= 12 ? 0.5 :
            diffHrs <= 24 ? 1 :
              Math.ceil(diffHrs / 12) * 0.5;

        return { ...bill, tripTime, billableDays, month };
      });

      this.listWaybill.set(enriched);

      const currentMonth = new Date().getMonth();
      this.selectedMonth.set(currentMonth)
      this.filteredWaybills.set(
        this.sortWaybills(enriched.filter(b => new Date(b.dataStart).getMonth() === currentMonth))
      );

      this.isLoading.set(false);
    } catch (error) {
      console.error(error);
      this.alert.show('error', 'Failed to load waybills');
      this.isLoading.set(false);
    }
  }
  getReport() {
    const tableBody: any[] = [];

    // Header row
    tableBody.push([
      { text: 'Truck', bold: true },
      { text: 'Trailer', bold: true },
      { text: 'Start', bold: true },
      { text: 'Finish', bold: true },
      { text: 'Trip Time', bold: true },
      { text: 'Billable Days', bold: true },
      { text: 'Notes', bold: true }
    ]);

    // Data rows
    this.filteredWaybills().forEach(bill => {
      tableBody.push([
        bill.truck,
        bill.trailer,
        new Date(bill.dataStart).toLocaleString(),
        new Date(bill.dataFinish).toLocaleString(),
        bill.tripTime,
        bill.billableDays,
        bill.notes || ''
      ]);
    });

    // Document definition
    const documentDefinition = {
      pageSize: 'A4',
      pageMargins: [20, 20, 20, 20] as [number, number, number, number],
      content: [
        { text: 'Waybill Report', style: 'header' },
        { text: `Month: ${this.selectedMonth() !== null ? this.months[this.selectedMonth()!] : ''}\n\n` },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', '*', 'auto', 'auto', '*'],
            body: tableBody
          }
        },
        { text: `\nTotal Billable Days: ${this.totalTime() || '-'}`, bold: true }
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 15]
        }
      }
    };

    // Generate and download PDF
    // @ts-ignore
    pdfMake.createPdf(documentDefinition).download('waybill-report--'+ this.months[this.selectedMonth()!] +'.pdf');
  }

  onMonthChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const monthId = Number(select.value);
    this.selectedMonth.set(isNaN(monthId) ? null : monthId);

    const bills = isNaN(monthId)
      ? this.listWaybill()
      : this.listWaybill().filter(b => new Date(b.dataStart).getMonth() === monthId);

    this.filteredWaybills.set(this.sortWaybills(bills));
  }


  editWaybill(id: string | undefined) {
    this.editId = id ?? null;
  }

  sortWaybills(array: _WillBill[]) {
    return array.sort((a, b) => Date.parse(a.dataStart) - Date.parse(b.dataStart));
  }

  saveWaybill(bill: _WillBill) {
    const { id, truck, trailer, dataStart, dataFinish, notes } = bill;
    this.fb.updateWayBillsHistory(id!, { truck, trailer, dataStart, dataFinish, notes })
      .then(() => this.alert.show('success', 'Waybill updated successfully'));
    this.editId = null;
  }

  async deleteWaybill(id: string | undefined) {
    if (!id) return;
    try {
      await this.fb.deleteWayBillHistory(id);
      this.listWaybill.set(this.listWaybill().filter(b => b.id !== id));
      this.filteredWaybills.set(this.filteredWaybills().filter(b => b.id !== id));
      this.alert.show('success', 'Waybill deleted successfully');
    } catch (error) {
      console.error('Error deleting waybill:', error);
      this.alert.show('error', 'Failed to delete waybill');
    }
  }
}
