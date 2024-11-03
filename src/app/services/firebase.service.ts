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
import { Observable, from, Subject, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private nuevoEventoSubject = new Subject<any>(); // Nuevo Subject para emitir eventos

  constructor(private firestore: Firestore) {}

  // Obtener el nombre dinámico del documento según el mes y año actuales (YYYY-MM)
  private obtenerNombreDocumento(): string {
    const fechaActual = new Date();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0'); // Asegura que siempre sea 2 dígitos
    const año = fechaActual.getFullYear();
    return `${año}-${mes}`; // Formato: YYYY-MM
  }

  // Obtener un documento específico por su ID utilizando Promesas (versión RxJS 6)
  getDocumentAsPromise(collectionName: string, docId: string): Promise<any> {
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return docData(docRef, { idField: 'id' }).toPromise();
  }

  // Agregar un evento en la subcolección dinámica
  addEvento(evento: any): Promise<void> {
    const documentName = this.obtenerNombreDocumento(); // Documento del mes actual
    const eventoData = {
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fecha: evento.fecha,
      cantidadEmpleados: evento.empleados.length,
      empleados: evento.empleados.map((emp: any) => ({
        nombre: emp.nombre,
        rol: emp.rol,
        horaInicio: emp.horaInicio,
        horaFin: emp.horaFin,
      })),
    };

    return addDoc(
      collection(this.firestore, `assignments/${documentName}/events`),
      eventoData
    ).then((docRef) => {
      this.emitirEvento({ id: docRef.id, ...eventoData });
    });
  }

  // Agregar un proyecto en la subcolección dinámica
  addProyecto(proyecto: any): Promise<void> {
    const documentName = this.obtenerNombreDocumento(); // Documento del mes actual
    const proyectoData = {
      proyectoId: proyecto.proyectoId,
      nombreProyecto: proyecto.nombreProyecto,
      descripcion: proyecto.descripcion,
      fecha: proyecto.fecha,
      cantidadEmpleados: proyecto.empleados.length,
      empleados: proyecto.empleados.map((emp: any) => ({
        nombre: emp.nombre,
        rol: emp.rol,
        horaInicio: emp.horaInicio,
        horaFin: emp.horaFin,
      })),
    };

    return addDoc(
      collection(this.firestore, `assignments/${documentName}/projects`),
      proyectoData
    ).then((docRef) => {
      this.emitirEvento({ id: docRef.id, ...proyectoData });
    });
  }

  // Observable para nuevos eventos del calendario
  get nuevoEvento$(): Observable<any> {
    return this.nuevoEventoSubject.asObservable();
  }

  // Emitir un nuevo evento
  emitirEvento(event: any) {
    this.nuevoEventoSubject.next(event);
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
      (data) => data?.name || 'Unknown employee'
    );
  }

  getMachineName(id: string): Promise<string> {
    return this.getDocumentAsPromise('machines', id).then(
      (data) => data?.name || 'Unknown machine'
    );
  }

  // Obtener proyectos desde la colección 'projects'
  getProjects(): Observable<{ id: string; name: string }[]> {
    const projectsCollection = collection(this.firestore, 'projects');

    return collectionData(projectsCollection, { idField: 'id' }).pipe(
      map((projects: any[]) =>
        projects.map((project) => ({
          id: project.id,
          name: project.name || 'No Name', // Manejo seguro del campo 'name'
        }))
      ),
      catchError((error) => {
        console.error('Error loading projects:', error);
        return []; // Retornar un array vacío en caso de error
      })
    );
  }

  // Obtener todas las asignaciones de eventos y proyectos por mes
  // Obtener todas las asignaciones de eventos y proyectos por mes
  getAssignments(documentName: string): Observable<any[]> {
    console.log('Cargando asignaciones desde el documento:', documentName);

    const docRef = doc(this.firestore, `assignments/${documentName}`);

    const eventsCollection = collection(docRef, 'events');
    const projectsCollection = collection(docRef, 'projects');

    const events$ = collectionData(eventsCollection, { idField: 'id' });
    const projects$ = collectionData(projectsCollection, { idField: 'id' });

    // Usamos firstValueFrom y tipamos el retorno como un array de objetos (any[])
    return from(
      Promise.all([
        firstValueFrom(events$ as Observable<any[]>), // Tipamos los eventos
        firstValueFrom(projects$ as Observable<any[]>), // Tipamos los proyectos
      ])
    ).pipe(
      map(([events, projects]) => [
        ...events.map((event: any) => ({
          id: event.id,
          title: event.name || event.description,
          start: event.date,
          type: 'event',
        })),
        ...projects.map((project: any) => ({
          id: project.id,
          title: project.projectName,
          start: project.date,
          type: 'project',
        })),
      ]),
      catchError((error) => {
        console.error('Error al cargar asignaciones:', error);
        return [];
      })
    );
  }

  // Generar el nombre del documento para el mes y año actuales
  private getAssignmentDocumentName(): string | null {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Asegura que el mes tenga 2 dígitos
      return `${year}-${month}`; // Formato YYYY-MM
    } catch (error) {
      console.error('Error al generar el nombre del documento:', error);
      return null;
    }
  }
}
