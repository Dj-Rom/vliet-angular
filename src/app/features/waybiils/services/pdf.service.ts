import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Injectable } from '@angular/core';
import { AlertService } from '../../../core/services/alert.service';

@Injectable({ providedIn: 'root' })
export class PdfReportService {
  constructor(private alert: AlertService) {}

  async createReport(rows: any[], start: Date | null, finish: Date | null) {
    try {
      rows.sort((a, b) => (a.start || '').localeCompare(b.start || '', 'pl', { numeric: true }));

      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (typeof navigator !== 'undefined' &&
          navigator.platform === 'MacIntel' &&
          navigator.maxTouchPoints > 1);

      const isMobile =
        isIOS || /Android|Huawei|HUAWEI|HarmonyOS|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      const doc = new jsPDF({ orientation: 'landscape' });

      // ───── FONT ─────
      try {
        const fontUrl = 'assets/fonts/DejaVuSans.ttf';
        const response = await fetch(fontUrl);
        if (response.ok) {
          const fontBuffer = await response.arrayBuffer();
          const fontBase64 = this.arrayBufferToBase64(fontBuffer);
          doc.addFileToVFS('DejaVuSans.ttf', fontBase64);
          doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
          doc.setFont('DejaVuSans');
        } else {
          doc.setFont('helvetica');
        }
      } catch (fontErr) {
        console.warn('Could not load custom font, falling back to default font:', fontErr);
        doc.setFont('helvetica');
      }

      // ───── TITLE ─────
      doc.setFontSize(14);
      const startStr = start ? start.toLocaleDateString('pl-PL') : '-';
      const finishStr = finish ? finish.toLocaleDateString('pl-PL') : '-';
      doc.text(`Raport kart drogowych\n${startStr} – ${finishStr}`, 14, 12);

      // ───── TABLE ─────
      autoTable(doc, {
        startY: 30,
        styles: { font: doc.getFont().fontName, fontSize: 9 },
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

      const fileName = `raport-listy-przewozowe-${startStr.replace(/\./g, '_')}.pdf`;
      const blob = doc.output('blob');

      // ───── iOS HANDLING (iPhone, iPad Safari) ─────
      if (isIOS) {
        const file = new File([blob], fileName, { type: 'application/pdf' });

        // 1. Primary iOS method: Web Share API (native share/save to Files dialog)
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Raport kart drogowych',
            });
            this.alert.show('success', 'PDF został wygenerowany.');
            return;
          } catch (shareErr: any) {
            // User cancelled share dialog or share failed
            if (shareErr.name === 'AbortError') {
              return;
            }
            console.warn('Web Share failed, attempting fallback view:', shareErr);
          }
        }

        // 2. Fallback iOS method: Open Blob URL in window/tab for native Safari PDF viewer
        try {
          const blobUrl = URL.createObjectURL(blob);
          const newTab = window.open(blobUrl, '_blank');
          if (!newTab) {
            window.location.href = blobUrl;
          }
          this.alert.show('success', 'PDF został otwarty.');
        } catch (e) {
          console.error('iOS fallback error:', e);
          this.alert.show('error', 'Błąd podczas otwierania PDF na iOS.');
        }
        return;
      }

      // ───── ANDROID & OTHER MOBILE ─────
      if (isMobile) {
        try {
          const file = new File([blob], fileName, { type: 'application/pdf' });
          if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Raport kart drogowych',
              });
              this.alert.show('success', 'PDF został wygenerowany.');
              return;
            } catch (shareErr: any) {
              if (shareErr.name === 'AbortError') return;
            }
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 5000);

          this.alert.show('success', 'PDF został pobrany.');
        } catch (error) {
          console.error('Mobile PDF error:', error);
          this.alert.show('error', 'Błąd podczas tworzenia PDF.');
        }
        return;
      }

      // ───── DESKTOP ─────
      try {
        doc.save(fileName);
        this.alert.show('success', 'PDF został zapisany.');
      } catch (e) {
        console.error('Desktop save error, fallback to blob:', e);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        this.alert.show('success', 'PDF został zapisany.');
      }
    } catch (error: any) {
      console.error('PDF Generation error:', error);
      this.alert.show('error', `Błąd podczas generowania raportu: ${error.message || error}`);
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
