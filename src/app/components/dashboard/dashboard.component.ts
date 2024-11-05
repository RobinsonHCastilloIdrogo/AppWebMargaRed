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
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { query, where } from 'firebase/firestore';
import { ProjectDetailsComponent } from '../project-dashboard/project-details/project-details.component';
import { ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle } from 'ng-apexcharts';
import { NgApexchartsModule } from 'ng-apexcharts';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  imports: [
    SharedDashboardComponent,
    NgIf,
    NgFor,
    DatePipe,
    FormsModule,
    ProjectDetailsComponent,
    NgApexchartsModule // Añadir aquí
  ],
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  projectsInProgress: number = 0;
  projectsCompleted: number = 0;
  employeesCount: number = 0;
  machinesCount: number = 0;
  projectsCount: number = 0;
  resources: { id: string; name: string }[] = [];
  events: {
    id: string;
    name: string;
    date: Date;
    horaInicio: string;
    horaFin: string;
  }[] = [];
  chart: any;
  showLogoutModal: boolean = false;

  selectedResource: string = '';
  assignedMachines: any[] = [];
  monthlyFuelData: number[] = new Array(12).fill(0);

  // Inicializar lineChartOptions
  lineChartOptions: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    title: ApexTitleSubtitle;
  } = {
    series: [], // Aquí puedes agregar tus datos de la serie
    chart: {
      type: 'line',
      height: '100%',
      toolbar: { // Añadir la configuración de la barra de herramientas
        show: true, // Mostrar la barra de herramientas
        tools: {
          download: true, // Ocultar el botón de descarga
          selection: true, // Ocultar el botón de selección
          zoom: true, // Ocultar el botón de zoom (lupa)
          pan: false, // Ocultar el botón de pan (mano)
          reset: true // Mantener el botón de reinicio (casa)
        },
      },
    },
    title: {
      text: 'Consumo de Combustible a lo Largo del Tiempo',
      align: 'left',
    },
    xaxis: {
      categories: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 
        'Mayo', 'Junio', 'Julio', 'Agosto', 
        'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ],
    },
  };  

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.getCounts();
    await this.loadEvents();
    await this.loadProjects();
    await this.loadMonthlyFuelTotals(); // Cargar datos de combustible mensual

    this.createChart();
    this.initializeLineChart();
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
    this.machinesCount = 0;
    machinesSnapshot.forEach((doc) => {
      const machineData = doc.data();
      this.machinesCount += machineData['quantity'];
    });
  }

  async loadEvents() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const path = `assignments/${year}-${month}/events`;

    try {
      const eventsCollection = collection(this.firestore, path);
      const eventsSnapshot = await getDocs(eventsCollection);

      this.events = eventsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const employees = data['empleados'] || [];
        const firstEmployee = employees[0] || {};
        const horaInicio = firstEmployee['horaInicio'] || '00:00';
        const horaFin = firstEmployee['horaFin'] || '00:00';

        return {
          id: doc.id,
          name: data['nombre'] || 'Evento sin nombre',
          date: data['fecha'] ? new Date(data['fecha']) : new Date(),
          horaInicio: horaInicio,
          horaFin: horaFin,
        };
      });
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  }

  async loadProjects() {
    try {
      const projectsCollection = collection(this.firestore, '/projects');
      const snapshot = await getDocs(projectsCollection);

      if (!snapshot.empty) {
        this.resources = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data()['name'] || 'Proyecto sin nombre',
        }));
      }
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  }

  async loadMonthlyFuelTotals() {
    try {
      const monthlyFuelCollection = collection(
        this.firestore,
        'monthlyFuelTotals'
      );
      const monthlyFuelSnapshot = await getDocs(monthlyFuelCollection);

      monthlyFuelSnapshot.forEach((doc) => {
        const month = doc.id;
        const totalFuel = doc.data()['totalFuel'] ?? 0;

        const monthIndex = this.getMonthIndex(month);
        if (monthIndex !== -1) {
          this.monthlyFuelData[monthIndex] = totalFuel;
        }
      });
    } catch (error) {
      console.error('Error al cargar los totales de combustible:', error);
    }
  }

  getMonthIndex(month: string): number {
    const monthMapping: { [key: string]: number } = {
      enero: 0,
      febrero: 1,
      marzo: 2,
      abril: 3,
      mayo: 4,
      junio: 5,
      julio: 6,
      agosto: 7,
      septiembre: 8,
      octubre: 9,
      noviembre: 10,
      diciembre: 11,
    };
    return monthMapping[month.toLowerCase()] ?? -1;
  }

  createChart() {
    const ctx = document.getElementById('myPieChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Máquinas Asignadas',
            data: [],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Máquinas Asignadas por Proyecto' },
        },
      },
    });
  }

  initializeLineChart() {
    // Suponiendo que monthlyFuelData ya está definido y contiene los datos de litros
    const monthlyCostData = this.monthlyFuelData.map(litros => litros * 4.91);
  
    this.lineChartOptions.series = [
      {
        name: 'Litros de Combustible',
        data: this.monthlyFuelData,
      },
      {
        name: 'Costo Total',
        data: monthlyCostData, // Datos del costo total calculados
      },
    ];
    
    this.lineChartOptions.xaxis.categories = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
  }  

  onResourceChange() {
    this.loadAssignedMachines();
  }

  async loadAssignedMachines() {
    if (!this.selectedResource) return;

    try {
      const machinesCollection = collection(
        this.firestore,
        `projects/${this.selectedResource}/team`
      );
      const snapshot = await getDocs(machinesCollection);

      this.assignedMachines = snapshot.docs.map((doc) => ({
        name: doc.data()['maquina']?.nombre ?? 'Maquina sin nombre',
        quantity: 1,
      }));

      this.updatePieChart();
    } catch (error) {
      console.error('Error al cargar máquinas asignadas:', error);
    }
  }

  updatePieChart() {
    const labels = this.assignedMachines.map((machine) => machine.name);
    const data = this.assignedMachines.map((machine) => machine.quantity);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.update();
  }

  // Métodos para el modal de cierre de sesión
  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  logout() {
    // Agregar lógica para cerrar sesión
    console.log('Sesión cerrada');
  }
}
