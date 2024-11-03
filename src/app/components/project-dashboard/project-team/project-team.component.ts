import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-project-team',
  standalone: true,
  imports: [CommonModule, NgIf],
  templateUrl: './project-team.component.html',
  styleUrls: ['./project-team.component.css'],
})
export class ProjectTeamComponent implements OnInit {
  projectId: string | null = null;
  teamMembers: any[] = []; // Almacena los datos de los miembros del equipo

  constructor(private route: ActivatedRoute, private firestore: Firestore) {}

  ngOnInit(): void {
    this.projectId = this.route.parent?.snapshot.paramMap.get('id') || null; // Solución al error de tipo
    if (this.projectId) {
      this.loadTeamMembers();
    }
  }

  async loadTeamMembers(): Promise<void> {
    if (!this.projectId) return;

    try {
      // Modificación: Acceder directamente a la subcolección 'team'
      const teamCollectionRef = collection(
        this.firestore,
        `projects/${this.projectId}/team`
      );
      const teamSnapshot = await getDocs(teamCollectionRef);

      this.teamMembers = teamSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('Equipo cargado:', this.teamMembers);
    } catch (error) {
      console.error('Error al cargar los miembros del equipo:', error);
    }
  }
}
