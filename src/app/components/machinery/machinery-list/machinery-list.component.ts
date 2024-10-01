import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collectionData, collection } from '@angular/fire/firestore'; // Importar Firestore
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
  searchTerm: string = ''; // Término de búsqueda de nombre
  isModalOpen: boolean = false;

  constructor(private firestore: Firestore) {
    const machinesCollection = collection(this.firestore, 'machines'); // Referencia a la colección 'machines'
    this.machines$ = collectionData(machinesCollection, {
      idField: 'id',
    }) as Observable<Machine[]>; // Obtener los datos de Firestore

    // Mostrar los datos en la consola del navegador para verificar
    this.machines$.subscribe((data) => {
      console.log('Maquinarias obtenidas:', data); // Mostrar los datos obtenidos
    });
  }

  // Filtrar maquinarias por nombre
  filteredMachines(machines: Machine[] | null) {
    if (!machines || machines.length === 0) {
      return []; // Si no hay maquinarias, retornar un array vacío
    }

    return machines.filter((machine) =>
      machine.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  openModal() {
    this.isModalOpen = true;
    console.log(this.isModalOpen);
  }

  closeModal() {
    this.isModalOpen = false;
  }
}
