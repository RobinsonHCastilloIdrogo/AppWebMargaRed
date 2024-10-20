import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-project-modal',
  templateUrl: './project-modal.component.html',
  standalone: true,
  imports: [FormsModule],
  styleUrls: ['./project-modal.component.css'],
})
export class ProjectModalComponent {
  projectName: string = ''; // Nombre del proyecto

  @Output() projectAdded = new EventEmitter<void>(); // Notificación de proyecto agregado
  @Output() closeModal = new EventEmitter<void>(); // Notificación para cerrar el modal

  constructor(private firestore: Firestore) {}

  async addProject() {
    if (this.projectName.trim()) {
      const projectsCollection = collection(this.firestore, 'projects'); // Colección de proyectos

      try {
        // Obtener fecha y hora exacta en formato Timestamp de Firebase
        const creationTimestamp = Timestamp.now();

        // Guardar el proyecto con nombre y timestamp de creación
        await addDoc(projectsCollection, {
          name: this.projectName,
          createdAt: creationTimestamp, // Registrar fecha y hora de creación
        });

        console.log('Proyecto agregado:', {
          name: this.projectName,
          createdAt: creationTimestamp.toDate(), // Mostrar fecha y hora en consola
        });

        this.projectName = ''; // Limpiar el input del nombre del proyecto
        this.projectAdded.emit(); // Notificar que se ha agregado un proyecto
        this.closeModal.emit(); // Cerrar el modal
      } catch (error) {
        console.error('Error al agregar proyecto:', error);
      }
    }
  }

  close() {
    this.projectName = ''; // Limpiar el nombre al cerrar
    this.closeModal.emit(); // Cerrar el modal
  }
}
