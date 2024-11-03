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

  // Agregar un evento en la subcolección `eventos` dentro de `asignaciones`
  addEvento(evento: any): Promise<void> {
    const eventoData = {
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      cantidadEmpleados: evento.empleados.length,
      empleados: evento.empleados.map((emp: any) => ({
        nombre: emp.nombre,
        rol: emp.rol,
        horaInicio: emp.horaInicio,
        horaFin: emp.horaFin,
      })),
    };
    return addDoc(
      collection(this.firestore, 'asignaciones/eventos/items'),
      eventoData
    ).then((docRef) => {
      this.emitirEvento({ id: docRef.id, ...eventoData });
    });
  }

  // Agregar un proyecto en la subcolección `proyectos` dentro de `asignaciones`
  addProyecto(proyecto: any): Promise<void> {
    const proyectoData = {
      proyectoId: proyecto.proyectoId,
      nombreProyecto: proyecto.nombreProyecto,
      descripcion: proyecto.descripcion,
      cantidadEmpleados: proyecto.empleados.length,
      empleados: proyecto.empleados.map((emp: any) => ({
        nombre: emp.nombre,
        rol: emp.rol,
        horaInicio: emp.horaInicio,
        horaFin: emp.horaFin,
      })),
    };
    return addDoc(
      collection(this.firestore, 'asignaciones/proyectos/items'),
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
      (data) => data?.name || 'Empleado desconocido'
    );
  }

  getMachineName(id: string): Promise<string> {
    return this.getDocumentAsPromise('machines', id).then(
      (data) => data?.name || 'Maquinaria desconocida'
    );
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

  // Obtener todas las asignaciones de eventos y proyectos
  getAssignments(): Observable<any[]> {
    const eventosCollection = collection(
      this.firestore,
      'asignaciones/eventos/items'
    );
    const proyectosCollection = collection(
      this.firestore,
      'asignaciones/proyectos/items'
    );

    const eventos$ = collectionData(eventosCollection, { idField: 'id' });
    const proyectos$ = collectionData(proyectosCollection, { idField: 'id' });

    return from(
      Promise.all([eventos$.toPromise(), proyectos$.toPromise()])
    ).pipe(
      map(([eventos, proyectos]) => [
        ...eventos.map((evento: any) => ({
          id: evento.id,
          title: evento.nombre, // Cambia a 'title' para que FullCalendar lo entienda
          start: evento.fecha, // Cambia a 'start' para que FullCalendar lo entienda
          tipo: 'evento',
        })),
        ...proyectos.map((proyecto: any) => ({
          id: proyecto.id,
          title: proyecto.nombreProyecto, // Cambia a 'title' para que FullCalendar lo entienda
          start: proyecto.fecha, // Cambia a 'start' para que FullCalendar lo entienda
          tipo: 'proyecto',
        })),
      ]),
      catchError((error) => {
        console.error('Error al cargar asignaciones:', error);
        return [];
      })
    );
  }
}
