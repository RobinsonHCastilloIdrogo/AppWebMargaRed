import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-project-modal',
  templateUrl: './project-modal.component.html',
  standalone: true,
  imports: [FormsModule],
  styleUrls: ['./project-modal.component.css'],
})
export class ProjectModalComponent {
  projectName: string = ''; // Nombre del proyecto

  @Output() projectAdded = new EventEmitter<void>(); // Evento para notificar que un proyecto ha sido agregado
  @Output() closeModal = new EventEmitter<void>(); // Evento para cerrar el modal

  constructor(private firestore: Firestore) {}

  async addProject() {
    if (this.projectName.trim()) {
      const projectsCollection = collection(this.firestore, 'projects');
      
      try {
        // Agregar el nuevo proyecto a Firestore
        await addDoc(projectsCollection, { name: this.projectName });
        console.log('Proyecto agregado a Firestore:', { name: this.projectName });
        
        this.projectName = ''; // Limpiar el campo de entrada
        this.projectAdded.emit(); // Emitir el evento para que el componente padre sepa que se ha agregado un nuevo proyecto
        this.closeModal.emit(); // Cerrar el modal
      } catch (error) {
        console.error('Error al agregar proyecto:', error);
      }
    }
  }

  close() {
    this.projectName = ''; // Limpiar el nombre del proyecto al cerrar
    this.closeModal.emit(); // Emitir evento para que el padre cierre el modal
  }
}
