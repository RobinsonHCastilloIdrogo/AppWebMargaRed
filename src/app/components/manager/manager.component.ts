import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, SharedDashboardComponent],
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css'],
})
export class ManagerComponent {}
