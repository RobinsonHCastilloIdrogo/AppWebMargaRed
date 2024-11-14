import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  Timestamp,
} from '@angular/fire/firestore';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { NgFor } from '@angular/common';

interface FuelRecord {
  machineId: string;
  machineType: string;
  totalFuelAssigned: number;
  dateAssigned?: Timestamp; // Asegúrate de que el tipo coincide con el tipo de Firestore
  monthlyTotals: { [month: string]: number };
}

@Component({
  selector: 'app-fuel-assignment-table',
  standalone: true,
  imports: [SharedDashboardComponent, NgFor],
  templateUrl: './fuel-assignment-table.component.html',
  styleUrls: ['./fuel-assignment-table.component.css'],
})
export class FuelAssignmentTableComponent implements OnInit {
  fuelRecords: FuelRecord[] = [];

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.loadFuelRecords();
  }

  private loadFuelRecords(): void {
    const fuelCollection = collection(this.firestore, 'machineFuelTotals');
    collectionData(fuelCollection, { idField: 'machineId' }).subscribe(
      (data: any[]) => {
        this.fuelRecords = data.map((doc: any) => ({
          machineId: doc.machineId,
          machineType: doc.machineType,
          totalFuelAssigned: doc.totalFuelAssigned || 0,
          dateAssigned: doc.dateAssigned, // Asegúrate de que el campo existe en Firestore
          monthlyTotals: doc.monthlyTotals || {},
        }));
      }
    );
  }

  formatDate(timestamp: Timestamp): string {
    if (!timestamp) return ''; // Verificación en caso de valor indefinido
    const date = timestamp.toDate(); // Convertir Timestamp de Firestore a Date
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  getMonths(record: FuelRecord): string[] {
    return record.monthlyTotals ? Object.keys(record.monthlyTotals) : [];
  }
}
