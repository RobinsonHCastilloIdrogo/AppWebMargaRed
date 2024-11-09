import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collectionData,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from '@angular/fire/firestore'; // Importar Firestore
import { Observable } from 'rxjs';
import { MachineryModalComponent } from '../machinery-modal/machinery-modal.component';

interface Machine {
  id: string;
  name: string;
  quantity: number;
  status: string;
}

@Component({
  selector: 'app-machinery-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MachineryModalComponent],
  templateUrl: './machinery-list.component.html',
  styleUrls: ['./machinery-list.component.css'],
})
export class MachineryListComponent {
  machines$: Observable<Machine[]>; // Observable para las maquinarias
  searchTerm: string = ''; // Término de búsqueda
  isModalOpen: boolean = false; // Controla la visibilidad del modal
  selectedMachine: Machine | null = null; // Maquinaria seleccionada para edición

  constructor(private firestore: Firestore) {
    const machinesCollection = collection(this.firestore, 'machines'); // Referencia a la colección 'machines'
    this.machines$ = collectionData(machinesCollection, {
      idField: 'id',
    }) as Observable<Machine[]>;

    // Mostrar los datos en la consola del navegador para verificar
    this.machines$.subscribe((data) => {
      console.log('Maquinarias obtenidas:', data); // Mostrar los datos obtenidos
    });
  }

  // Filtrar maquinarias por nombre
  filteredMachines(machines: Machine[] | null) {
    if (!machines || machines.length === 0) {
      return [];
    }
    return machines.filter((machine) =>
      machine.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Abrir el modal con una nueva maquinaria o una maquinaria seleccionada
  openModal(machine: Machine | null = null) {
    this.selectedMachine = machine; // Guardar la maquinaria seleccionada (o null para nueva)
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedMachine = null; // Limpiar la selección
  }

  // Función para eliminar una máquina
  async deleteMachine(machineId: string) {
    try {
      const machineDocRef = doc(this.firestore, `machines/${machineId}`);
      await deleteDoc(machineDocRef);
      console.log(`Máquina con ID ${machineId} eliminada.`);
    } catch (error) {
      console.error('Error al eliminar la máquina:', error);
    }
  }
}
