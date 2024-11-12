import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  // Subjects para los estados del proyecto
  private projectsInProgressSubject = new BehaviorSubject<number>(0);
  private projectsCompletedSubject = new BehaviorSubject<number>(0);

  // Observables expuestos para ser consumidos por los componentes
  projectsInProgress$ = this.projectsInProgressSubject.asObservable();
  projectsCompleted$ = this.projectsCompletedSubject.asObservable();

  constructor(private firestore: Firestore) {}

  async loadProjectStatusCounts() {
    try {
      const projectsCollection = collection(this.firestore, 'projects');
      const projectsSnapshot = await getDocs(projectsCollection);

      let projectsInProgress = 0;
      let projectsCompleted = 0;

      for (const projectDoc of projectsSnapshot.docs) {
        // Cambiar la ruta para buscar dentro de la subcolección `details`
        const detailsCollection = collection(
          this.firestore,
          `projects/${projectDoc.id}/details`
        );
        const detailsSnapshot = await getDocs(detailsCollection);

        if (!detailsSnapshot.empty) {
          detailsSnapshot.docs.forEach((detailDoc) => {
            const status = detailDoc.data()['status'];
            if (status === 'En curso') {
              projectsInProgress++;
            } else if (status === 'Finalizado') {
              projectsCompleted++;
            }
          });
        }
      }

      this.projectsInProgressSubject.next(projectsInProgress);
      this.projectsCompletedSubject.next(projectsCompleted);
    } catch (error) {
      console.error('Error al cargar el conteo de proyectos:', error);
    }
  }
}
