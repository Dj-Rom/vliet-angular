import { Component, Input } from '@angular/core';
import { MoreMenuService } from '../../../services/load-calculator-services/more-menu';

@Component({
  selector: 'app-more-menu',
  imports: [],
  templateUrl: './more-menu.html',
  styleUrl: './more-menu.css',
})
export class MoreMenu {
  @Input() date!: string;
  @Input() title!: string;

  constructor(private moreMenuService: MoreMenuService) {}

  onDelete(id: string) {
    this.moreMenuService.deleteListItem(id);
  }

  onSend(id: string) {
    this.moreMenuService.sendToWhatsApp(id);
  }

  edit(id: string) {
    this.moreMenuService.editListItem(id);
  }
}
