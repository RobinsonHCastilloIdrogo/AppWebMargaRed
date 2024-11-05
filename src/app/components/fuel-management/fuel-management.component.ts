import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Firestore, doc, collection, getDocs, setDoc, Timestamp, arrayUnion, increment } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Machine } from '/Users/Estefano Quito/Documents/GitHub/AppWebMargaRed/src/app/models/machine.model';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-fuel-management',
  standalone: true,
  imports: [FormsModule, CommonModule, SharedDashboardComponent],
  templateUrl: './fuel-management.component.html',
  styleUrls: ['./fuel-management.component.css'],
})
export class FuelManagementComponent implements OnInit {
  @Input() machines: Machine[] = [];
  machineTypes: string[] = [];
  specificMachines: Machine[] = [];
  filteredMachines: Machine[] = []; // Lista para las máquinas filtradas en el campo de búsqueda
  selectedMachine?: Machine;
  fuelAmount: number = 0;
  searchQuery: string = '';  // Variable para el cuadro de búsqueda
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.loadMachines();
  }

  async loadMachines(): Promise<void> {
    const machinesCollection = collection(this.firestore, 'machines');
    const machineSnapshot = await getDocs(machinesCollection);
  
    const machinesMap = new Map<string, Machine[]>();
    machineSnapshot.docs.forEach(doc => {
      const data = doc.data() as { machines: Machine[] };
      if (data && Array.isArray(data['machines'])) {
        data['machines'].forEach(machine => {
          const { id, name, quantity, status } = machine;
          if (!machinesMap.has(name)) {
            machinesMap.set(name, []);
            this.machineTypes.push(name);
          }
          machinesMap.get(name)?.push({ id, name, quantity, status } as Machine);
        });
      }
    });
  
    this.machines = Array.from(machinesMap.values()).flat();
    console.log('Máquinas cargadas:', this.machines);
  }

  filterMachines(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.filteredMachines = query
      ? this.machines.filter(machine =>
          machine.name.toLowerCase().includes(query) || machine.id.toString().includes(query)
        )
      : [];
  }

  selectMachine(machine: Machine): void {
    this.selectedMachine = machine;
    this.fuelAmount = 0;
    this.filteredMachines = []; // Oculta la lista desplegable después de seleccionar
  }

  async assignFuel(): Promise<void> {
    if (this.selectedMachine && this.fuelAmount > 0) {
      try {
        const fuelDocRef = doc(this.firestore, `machines/${this.selectedMachine.name}/fuelAssignments/${this.selectedMachine.id}`);
        
        const newFuelEntry = {
          Combustible: this.fuelAmount,
          Fecha: Timestamp.now()
        };
        
        await setDoc(
          fuelDocRef,
          { fuelHistory: arrayUnion(newFuelEntry) },
          { merge: true }
        );

        const month = new Date().toLocaleString('default', { month: 'long' });
        const monthDocRef = doc(this.firestore, `monthlyFuelTotals/${month}`);

        await setDoc(
          monthDocRef,
          { totalFuel: increment(this.fuelAmount) },
          { merge: true }
        );

        const machineTotalDocRef = doc(this.firestore, `machineFuelTotals/${this.selectedMachine.id}`);
        
        await setDoc(
          machineTotalDocRef,
          { 
            totalFuelAssigned: increment(this.fuelAmount), 
            machineType: this.selectedMachine.name,
            monthlyTotals: {
              [month]: increment(this.fuelAmount)
            }
          },
          { merge: true }
        );

        Swal.fire({
          title: '¡Éxito!',
          text: `Combustible asignado a ${this.selectedMachine.name}: ${this.fuelAmount} L`,
          icon: 'success',
          confirmButtonText: 'Aceptar',
        });
  
        this.resetForm();
      } catch (error) {
        Swal.fire({
          title: '¡Error!',
          text: 'Error al asignar combustible. Intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        console.error('Error al asignar combustible:', error);
      }
    } else {
      Swal.fire({
        title: '¡Advertencia!',
        text: 'Selecciona una máquina y asigna una cantidad válida de combustible.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  private resetForm(): void {
    this.selectedMachine = undefined;
    this.fuelAmount = 0;
    this.searchQuery = '';  // Limpia el campo de búsqueda
    this.filteredMachines = []; // Vacía la lista de máquinas filtradas
    this.successMessage = '';
    this.errorMessage = '';
  }
}
