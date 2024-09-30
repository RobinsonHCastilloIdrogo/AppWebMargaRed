import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachineryListComponent } from './machinery-list/machinery-list.component';
import { MachineryModalComponent } from './machinery-modal/machinery-modal.component';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';

@Component({
  selector: 'app-machinery',
  standalone: true,
  imports: [
    CommonModule,
    MachineryListComponent,
    MachineryModalComponent,
    SharedDashboardComponent,
  ],
  templateUrl: './machinery.component.html',
  styleUrls: ['./machinery.component.css'],
})
export class MachineryComponent {
  showModal: boolean = false;

  openModal() {
    this.showModal = true;
  }

  handleCloseModal() {
    this.showModal = false;
  }
}
