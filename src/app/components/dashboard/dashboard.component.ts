import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from '@angular/fire/firestore';
import { Chart, registerables } from 'chart.js';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { NgFor, NgIf } from '@angular/common';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedDashboardComponent, NgFor, NgIf, DatePipe, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  employeesCount: number = 0;
  machinesCount: number = 0;
  projectsCount: number = 0;
  projectsInProgressCount: number = 0; // Proyectos en curso
  projectsPendingCount: number = 0; // Proyectos pendientes
  projectsCompletedCount: number = 0; // Proyectos finalizados

  isEventSelected: boolean = true; // Controla si se muestran eventos o proyectos
  events: any[] = []; // Almacena los eventos cargados
  projects: any[] = []; // Almacena los proyectos cargados
  displayedItems: any[] = []; // Elementos mostrados en la tabla

  chart: any;
  lineChart: any;
  showLogoutModal: boolean = false;

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.getCounts(); // Obtener contadores de empleados, proyectos y máquinas
    await this.loadEvents(); // Cargar eventos desde Firestore
    await this.loadProjects(); // Cargar proyectos desde Firestore
    this.updateDisplayedItems(); // Actualiza los elementos mostrados en la tabla
    this.createChart(); // Crear gráfico circular
    this.createLineChart(); // Crear gráfico de líneas
  }

  async getCounts() {
    const employeesCollection = collection(this.firestore, '/employees');
    const machinesCollection = collection(this.firestore, '/machines');
    const projectsCollection = collection(this.firestore, '/projects');

    const employeesSnapshot = await getDocs(employeesCollection);
    const machinesSnapshot = await getDocs(machinesCollection);
    const projectsSnapshot = await getDocs(projectsCollection);

    this.employeesCount = employeesSnapshot.size;
    this.projectsCount = projectsSnapshot.size;

    // Calcular la cantidad total de máquinas sumando las cantidades individuales
    this.machinesCount = 0;
    machinesSnapshot.forEach((doc) => {
      const machineData = doc.data();
      this.machinesCount += machineData['quantity'];
    });
  }

  async loadEvents() {
    const eventsCollection = collection(this.firestore, '/assignments');
    const eventsSnapshot = await getDocs(eventsCollection);

    this.events = eventsSnapshot.docs
      .filter((doc) => doc.data()['nombreEvento']) // Filtra solo eventos
      .map((doc) => ({
        id: doc.id,
        nombreEvento: doc.data()['nombreEvento'],
        date: new Date(doc.data()['date']),
        horaInicio: doc.data()['horaInicio'] ?? '00:00',
        horaFin: doc.data()['horaFin'] ?? '00:00',
      }));

    console.log('Eventos cargados:', this.events);
  }

  async loadProjects() {
    const projectsCollection = collection(this.firestore, '/assignments');
    const projectsSnapshot = await getDocs(projectsCollection);

    this.projects = projectsSnapshot.docs
      .filter((doc) => doc.data()['nombreProyecto']) // Filtra solo proyectos
      .map((doc) => {
        const projectData = doc.data();
        const status = projectData['status']; // Suponemos que tienes un campo 'status' para el estado del proyecto

        // Clasificar proyectos según el estado
        if (status === 'en curso') {
          this.projectsInProgressCount++;
        } else if (status === 'pendiente') {
          this.projectsPendingCount++;
        } else if (status === 'finalizado') {
          this.projectsCompletedCount++;
        }

        return {
          id: doc.id,
          nombreProyecto: projectData['nombreProyecto'],
          date: new Date(projectData['date']),
          horaInicio: projectData['horaInicio'] ?? '00:00',
          horaFin: projectData['horaFin'] ?? '00:00',
        };
      });

    console.log('Proyectos cargados:', this.projects);
  }

  selectView(isEvent: boolean): void {
    this.isEventSelected = isEvent;
    this.updateDisplayedItems(); // Actualiza los elementos de la tabla
  }

  updateDisplayedItems(): void {
    this.displayedItems = this.isEventSelected ? this.events : this.projects;
  }

  async deleteItem(itemId: string) {
    try {
      await deleteDoc(doc(this.firestore, `/assignments/${itemId}`));
      console.log(`Elemento ${itemId} eliminado`);
      this.updateDisplayedItems(); // Actualiza la tabla después de eliminar
    } catch (error) {
      console.error('Error al eliminar el elemento:', error);
    }
  }

  viewItem(itemId: string) {
    console.log(`Visualizando elemento con ID: ${itemId}`);
  }

  openLogoutModal() {
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  logout() {
    this.closeLogoutModal();
    console.log('Cierre de sesión exitoso');
  }

  createChart() {
    const ctx = document.getElementById('myPieChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Empleados', 'Máquinas'],
        datasets: [
          {
            label: 'Cantidad',
            data: [this.employeesCount, this.machinesCount],
            backgroundColor: ['rgba(0, 123, 255, 0.8)', 'rgba(255, 0, 0, 0.8)'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Cantidad de Empleados y Máquinas' },
        },
      },
    });
  }

  createLineChart() {
    const ctx = document.getElementById('myLineChart') as HTMLCanvasElement;
    const labels = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const data = [300, 400, 250, 500, 450, 600, 700, 800, 650, 900, 750, 1000];

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Litros de Combustible',
            data: data,
            backgroundColor: 'rgba(0, 123, 255, 0.2)',
            borderColor: 'rgba(0, 123, 255, 1)',
            borderWidth: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: 'Consumo de Combustible a lo Largo del Tiempo',
          },
        },
        scales: {
          y: { beginAtZero: true },
          x: { beginAtZero: true },
        },
      },
    });
  }
}
