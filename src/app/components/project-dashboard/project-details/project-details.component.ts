import { Component, Input, OnInit } from '@angular/core';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-project-details',
  imports: [DatePipe],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css'],
  standalone: true,
})
export class ProjectDetailsComponent implements OnInit {
  @Input() project: any; // Recibe los datos del proyecto desde el componente padre

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    if (!this.project) {
      console.error('No se encontraron los detalles del proyecto.');
    }
  }

  // Método para editar los detalles del proyecto
  async editProject() {
    try {
      const updatedName = prompt(
        'Ingrese el nuevo nombre del proyecto:',
        this.project.name
      );
      if (updatedName) {
        const projectDocRef = doc(
          this.firestore,
          `projects/${this.project.id}`
        );
        await updateDoc(projectDocRef, { name: updatedName });
        alert('El proyecto ha sido actualizado exitosamente.');
      }
    } catch (error) {
      console.error('Error al actualizar el proyecto:', error);
    }
  }
}
