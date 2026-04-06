import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Injectable } from '@angular/core';
import { AlertService } from '../../../core/services/alert.service';

@Injectable({ providedIn: 'root' })
export class PdfReportService {
  constructor(private alert: AlertService) {}

  async createReport(rows: any[], start: Date | null, finish: Date | null) {
    rows.sort((a, b) => a.start.localeCompare(b.start, 'pl', { numeric: true, timeZone: 'UTC' }));
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = /Android|iPhone|iPad|iPod|Huawei|HUAWEI|HarmonyOS/i.test(navigator.userAgent);

    const doc = new jsPDF({ orientation: 'landscape' });

    // ───── FONT ─────
    const fontUrl = 'assets/fonts/DejaVuSans.ttf';
    const fontBuffer = await fetch(fontUrl).then((r) => r.arrayBuffer());
    const fontBase64 = this.arrayBufferToBase64(fontBuffer);
    doc.addFileToVFS('DejaVuSans.ttf', fontBase64);
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
    doc.setFont('DejaVuSans');

    // ───── TITLE ─────
    doc.setFontSize(14);
    doc.text(
      `Raport kart drogowych\n${start?.toLocaleDateString('pl-PL')} – ${finish?.toLocaleDateString('pl-PL')}`,
      14,
      12,
    );

    // ───── TABLE ─────
    autoTable(doc, {
      startY: 30,
      styles: { font: 'DejaVuSans', fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      head: [['Ciagnik', 'Naczepa', 'Start', 'Koniec', 'Dni', 'Czas', 'Uwagi']],
      body: rows.map((r) => [
        r.truck ?? '-',
        r.trailer ?? '-',
        r.start ?? '-',
        r.finish ?? '-',
        r.billableDays ?? '-',
        r.tripTime ?? '-',
        r.notes ?? '',
      ]),
      theme: 'grid',
    });

    // ───── TOTAL ─────
    const totalDays = rows.reduce(
      (sum, r) => sum + (isNaN(+r.billableDays) ? 0 : +r.billableDays),
      0,
    );
    doc.text(`Total dni: ${totalDays}`, 240, 15);

    // ───── iOS/MOBILE SAFE SAVE ─────
    if (isIOS) {
      // iOS-specific handling
      const pdfDataUri = doc.output('dataurlstring');
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = 'raport-listy-przewozowe.pdf';

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.alert.show('success', 'PDF został pobrany. Sprawdź folder Pobrane.');
    } else if (isMobile) {
      // Android and other mobile browsers
      try {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);

        // Try to open in new tab
        const newWindow = window.open(url, '_blank');

        if (!newWindow) {
          // Fallback: trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = 'raport-listy-przewozowe.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }

        this.alert.show('success', 'PDF został otwarty/pobrany.');
      } catch (error) {
        console.error('Mobile PDF error:', error);
        this.alert.show('error', 'Błąd podczas tworzenia PDF.');
      }
    } else {
      // Desktop download
      doc.save('raport-listy-przewozowe.pdf');
      this.alert.show('success', 'PDF został zapisany.');
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
