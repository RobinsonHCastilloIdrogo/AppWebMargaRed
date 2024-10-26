import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Firestore, doc, collection, getDocs, setDoc, Timestamp, arrayUnion } from '@angular/fire/firestore';
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
  machineTypes: string[] = []; // Para almacenar tipos de máquina únicos
  specificMachines: Machine[] = []; // Para almacenar máquinas específicas según el tipo seleccionado
  selectedMachineType?: string; // Para almacenar el tipo de máquina seleccionado
  selectedMachine?: Machine; // Para almacenar la máquina específica seleccionada
  fuelAmount: number = 0; 
  successMessage: string = ''; 
  errorMessage: string = ''; 

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.loadMachines();
  }

  async loadMachines(): Promise<void> {
    const machinesCollection = collection(this.firestore, 'machines');
    const machineSnapshot = await getDocs(machinesCollection);
  
    // Agrupar máquinas por tipo
    const machinesMap = new Map<string, Machine[]>();
    machineSnapshot.docs.forEach(doc => {
      const data = doc.data() as { machines: Machine[] };
      if (data && Array.isArray(data['machines'])) {
        data['machines'].forEach(machine => {
          const { id, name, quantity, status } = machine;
          if (!machinesMap.has(name)) {
            machinesMap.set(name, []);
            this.machineTypes.push(name); // Agregar tipo de máquina a la lista
          }
          machinesMap.get(name)?.push({ id, name, quantity, status } as Machine);
        });
      }
    });
  
    this.machines = Array.from(machinesMap.values()).flat(); // Aplanar el array de máquinas
    console.log('Máquinas cargadas:', this.machines);
  }  

  selectMachineType(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedMachineType = selectElement.value;
    this.specificMachines = this.machines.filter(machine => machine.name === this.selectedMachineType); // Filtrar máquinas específicas
    this.selectedMachine = undefined; // Reiniciar máquina seleccionada
    this.fuelAmount = 0; // Reiniciar cantidad de combustible
  }

  selectSpecificMachine(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedIndex = selectElement.selectedIndex;
    this.selectedMachine = selectedIndex > 0 ? this.specificMachines[selectedIndex - 1] : undefined;
    this.fuelAmount = 0; // Reiniciar cantidad de combustible
  }

  async assignFuel(): Promise<void> {
    if (this.selectedMachine && this.fuelAmount > 0) {
      try {
        const fuelDocRef = doc(this.firestore, `machines/${this.selectedMachineType}/fuelAssignments/${this.selectedMachine.id}`);
        
        // Agregar nueva entrada de combustible al historial
        const newFuelEntry = {
          Combustible: this.fuelAmount,
          Fecha: Timestamp.now()
        };
        
        await setDoc(
          fuelDocRef,
          { fuelHistory: arrayUnion(newFuelEntry) },
          { merge: true }
        );
  
        // Muestra un mensaje de éxito con SweetAlert2
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
    this.selectedMachineType = undefined; // Reiniciar tipo de máquina
    this.specificMachines = []; // Reiniciar máquinas específicas
    this.selectedMachine = undefined; // Reiniciar máquina seleccionada
    this.fuelAmount = 0; 
    this.successMessage = ''; 
    this.errorMessage = ''; 
  }
}
