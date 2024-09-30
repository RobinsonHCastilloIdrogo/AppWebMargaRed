import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  machines: Machine[] = [];
  searchTerm: string = ''; // Término de búsqueda de nombre
  isModalOpen: boolean = false;

  constructor() {
    // Aquí puedes agregar máquinas para probar
    this.machines = [
      {
        id: '1',
        name: 'Excavadora',
        quantity: 5,
        status: 'Disponible',
      },
      {
        id: '2',
        name: 'Retroexcavadora',
        quantity: 3,
        status: 'Ocupado',
      },
    ];
  }

  // Filtrar máquinas por nombre
  filteredMachines() {
    return this.machines.filter((machine) =>
      machine.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }
}
