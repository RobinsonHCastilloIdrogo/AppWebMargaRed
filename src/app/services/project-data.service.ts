import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  collection,
  addDoc,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ProjectDataService {
  constructor(private firestore: Firestore) {}

  // Añadir o actualizar un detalle a un proyecto específico
  async addDetailToProject(projectId: string, detailData: any): Promise<void> {
    const detailDocRef = doc(
      this.firestore,
      `projects/${projectId}/details/main`
    );
    await setDoc(detailDocRef, detailData, { merge: true });
  }

  // Añadir una tarea a un proyecto específico
  async addTaskToProject(projectId: string, taskData: any): Promise<void> {
    const tasksCollection = collection(
      this.firestore,
      `projects/${projectId}/tasks`
    );
    await addDoc(tasksCollection, taskData);
  }

  // Añadir un miembro del equipo a un proyecto específico
  async addTeamMemberToProject(
    projectId: string,
    teamData: any
  ): Promise<void> {
    const teamCollection = collection(
      this.firestore,
      `projects/${projectId}/team`
    );
    await addDoc(teamCollection, teamData);
  }
}
