import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component'; // Omitimos AngularFirestore

@Component({
  selector: 'app-assign-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedDashboardComponent],
  templateUrl: './assign-resources.component.html',
  styleUrls: ['./assign-resources.component.css'],
})
export class AssignResourcesComponent implements OnInit {
  employees: any[] = [
    { id: '1', name: 'Empleado 1' },
    { id: '2', name: 'Empleado 2' },
  ]; // Datos estáticos de prueba
  machines: any[] = [
    { id: '1', name: 'Máquina 1', status: 'Disponible' },
    { id: '2', name: 'Máquina 2', status: 'Ocupado' },
  ]; // Datos estáticos de prueba
  selectedEmployee: string = '';
  selectedMachine: string = '';
  selectedMachineName: string = '';

  constructor() {}

  ngOnInit(): void {
    // Comentamos las llamadas a Firebase
    // this.firestore.collection('employees').snapshotChanges() ...
    // this.firestore.collection('machines').snapshotChanges() ...
  }

  // Function to assign the machine
  async handleAssignMachine() {
    if (!this.selectedEmployee || !this.selectedMachine) {
      alert('Por favor selecciona un empleado y una máquina.');
      return;
    }

    alert('Máquina asignada exitosamente.');
    this.selectedEmployee = '';
    this.selectedMachine = '';
  }

  // Function to set the selected machine name
  setSelectedMachineName(event: any) {
    const machine = this.machines.find(
      (machine) => machine.id === event.target.value
    );
    this.selectedMachineName = machine ? machine.name : '';
  }
}
