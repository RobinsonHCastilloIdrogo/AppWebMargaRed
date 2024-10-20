import { Injectable } from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  docData,
} from '@angular/fire/firestore';
import { Observable, from, Subject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private nuevoEventoSubject = new Subject<any>(); // Nuevo Subject para emitir eventos

  constructor(private firestore: Firestore) {}

  // Obtener datos de una colección en tiempo real
  getData(collectionName: string): Observable<any[]> {
    const collectionRef = collection(this.firestore, collectionName);
    return collectionData(collectionRef, { idField: 'id' });
  }

  // Obtener un documento específico por su ID con validación de ID
  getDocument(collectionName: string, docId: string): Observable<any> {
    if (!docId) {
      throw new Error(
        `El ID del documento no puede ser nulo para la colección ${collectionName}`
      );
    }
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return docData(docRef, { idField: 'id' });
  }

  // Obtener un documento por su ID utilizando Promesas
  getDocumentAsPromise(collectionName: string, docId: string): Promise<any> {
    if (!docId) {
      return Promise.reject(
        new Error(
          `El ID del documento no puede ser nulo para la colección ${collectionName}`
        )
      );
    }
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return docData(docRef, { idField: 'id' }).toPromise();
  }

  // Agregar un nuevo documento a una colección
  addData(collectionName: string, data: any) {
    const collectionRef = collection(this.firestore, collectionName);
    return addDoc(collectionRef, data);
  }

  // Actualizar un documento existente
  updateData(collectionName: string, docId: string, data: any) {
    if (!docId) {
      throw new Error(
        `El ID del documento no puede ser nulo para actualizar en ${collectionName}`
      );
    }
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return updateDoc(docRef, data);
  }

  // Eliminar un documento
  deleteData(collectionName: string, docId: string) {
    if (!docId) {
      throw new Error(
        `El ID del documento no puede ser nulo para eliminar en ${collectionName}`
      );
    }
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return deleteDoc(docRef);
  }

  // Obtener empleados desde la colección 'employees'
  getEmployees(): Observable<any[]> {
    const employeesCollection = collection(this.firestore, 'employees');
    return collectionData(employeesCollection, { idField: 'id' });
  }

  // Obtener máquinas desde la colección 'machines'
  getMachines(): Observable<any[]> {
    const machinesCollection = collection(this.firestore, 'machines');
    return collectionData(machinesCollection, { idField: 'id' });
  }

  getEmployeeName(id: string): Promise<string> {
    return this.getDocumentAsPromise('employees', id).then(
      (data) => data?.name || 'Empleado desconocido'
    );
  }

  getMachineName(id: string): Promise<string> {
    return this.getDocumentAsPromise('machines', id).then(
      (data) => data?.name || 'Maquinaria desconocida'
    );
  }

  // Agregar un empleado
  addEmployee(employee: any) {
    const employeesCollection = collection(this.firestore, 'employees');
    return addDoc(employeesCollection, employee);
  }

  // Guardar una nueva asignación en Firebase
  addAssignment(assignment: any) {
    const assignmentsCollection = collection(this.firestore, 'assignments');
    return addDoc(assignmentsCollection, assignment).then((docRef) => {
      const event = {
        id: docRef.id, // Capturar el ID generado por Firebase
        title: assignment.nombreEvento,
        start: assignment.date,
        extendedProps: { ...assignment },
      };
      this.emitirEvento(event); // Emitir el evento
    });
  }

  // Obtener todas las asignaciones
  // Obtener todas las asignaciones utilizando collectionData
  getAssignments(): Observable<any[]> {
    const assignmentsCollection = collection(this.firestore, 'assignments');

    return collectionData(assignmentsCollection, { idField: 'id' }).pipe(
      map((assignments: any[]) =>
        assignments.map((assignment) => ({
          id: assignment.id,
          title: assignment.nombreEvento,
          start: assignment.date,
          extendedProps: { ...assignment },
        }))
      )
    );
  }

  // Obtener múltiples documentos por sus IDs
  getMultipleDocuments(
    collectionName: string,
    ids: string[]
  ): Observable<any[]> {
    const observables = ids.map((id) => this.getDocument(collectionName, id));
    return from(Promise.all(observables));
  }

  // Observable para nuevos eventos del calendario
  get nuevoEvento$(): Observable<any> {
    return this.nuevoEventoSubject.asObservable();
  }

  // Emitir un nuevo evento
  emitirEvento(event: any) {
    this.nuevoEventoSubject.next(event);
  }

  // Obtener proyectos desde la colección 'projects'
  getProjects(): Observable<{ id: string; name: string }[]> {
    const projectsCollection = collection(this.firestore, 'projects');

    return collectionData(projectsCollection, { idField: 'id' }).pipe(
      map((projects: any[]) =>
        projects.map((project) => ({
          id: project.id,
          name: project.name || 'Sin Nombre', // Manejo seguro del campo 'name'
        }))
      ),
      catchError((error) => {
        console.error('Error al cargar proyectos:', error);
        return []; // Retornar un array vacío en caso de error
      })
    );
  }
}
