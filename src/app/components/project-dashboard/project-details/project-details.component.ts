import { Component, Input, OnInit } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-details',
  imports: [DatePipe, CommonModule, FormsModule],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css'],
  standalone: true,
})
export class ProjectDetailsComponent implements OnInit {
  @Input() project: any; // Recibe los datos del proyecto desde el componente padre
  projectId: string | null = null;

  // Variables para almacenar los detalles del proyecto
  projectName: string = '';
  projectDescription: string = '';
  startDate: string = '';
  endDate: string = '';
  status: string = '';

  constructor(private firestore: Firestore, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id'); // Obtener el ID del proyecto
    if (!this.projectId) {
      console.error('No se encontró el ID del proyecto.');
    } else if (this.project) {
      // Asignar los valores iniciales a las variables del formulario
      this.projectName = this.project.name || '';
      this.projectDescription = this.project.description || '';
      this.startDate = this.project.startDate || '';
      this.endDate = this.project.endDate || '';
      this.status = this.project.status || '';
    }
  }

  // Método para actualizar los detalles del proyecto en Firestore
  async saveDetails(): Promise<void> {
    if (!this.projectId) {
      console.error('No se encontró el ID del proyecto.');
      return;
    }

    try {
      const projectDocRef = doc(this.firestore, `projects/${this.projectId}`);
      await setDoc(
        projectDocRef,
        {
          name: this.projectName,
          description: this.projectDescription,
          startDate: this.startDate,
          endDate: this.endDate,
          status: this.status,
        },
        { merge: true }
      );

      console.log('Detalles del proyecto actualizados correctamente');
      alert('Detalles del proyecto actualizados exitosamente.');
    } catch (error) {
      console.error('Error al actualizar el proyecto:', error);
    }
  }
}
