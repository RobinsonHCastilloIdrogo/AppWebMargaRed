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

      const inProgressQuery = query(
        projectsCollection,
        where('status', '==', 'En curso')
      );
      const completedQuery = query(
        projectsCollection,
        where('status', '==', 'Finalizado')
      );

      const [inProgressSnapshot, completedSnapshot] = await Promise.all([
        getDocs(inProgressQuery),
        getDocs(completedQuery),
      ]);

      this.projectsInProgressSubject.next(inProgressSnapshot.size);
      this.projectsCompletedSubject.next(completedSnapshot.size);

      console.log('Proyectos en curso:', inProgressSnapshot.size);
      console.log('Proyectos finalizados:', completedSnapshot.size);
    } catch (error) {
      console.error('Error al cargar el conteo de proyectos:', error);
    }
  }
}
