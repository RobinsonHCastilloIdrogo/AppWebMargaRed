import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  Timestamp,
  getDocs,
} from '@angular/fire/firestore';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';  // Importa la librería html2canvas
import * as XLSX from 'xlsx';  // Importa la librería xlsx
import * as FileSaver from 'file-saver';  // Para exportar CSV
import jsPDF from 'jspdf';  // Para PDF
import 'jspdf-autotable';  // Importa el complemento para autoTable

interface FuelRecord {
  machineId: string;
  machineType: string;
  totalFuelAssigned: number;
  dateAssigned?: Timestamp; // Asegúrate de que el tipo coincide con el tipo de Firestore
  monthlyTotals: { [month: string]: number };
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

interface TeamMember {
  machineId: string;
  employeeName: string;
  projectName: string;  // Nueva propiedad para almacenar el nombre del proyecto
  startHour: string;    // Nueva propiedad para almacenar la hora de inicio
  endHour: string;      // Nueva propiedad para almacenar la hora de fin
}

@Component({
  selector: 'app-fuel-assignment-table',
  standalone: true,
  imports: [SharedDashboardComponent, CommonModule],
  templateUrl: './fuel-assignment-table.component.html',
  styleUrls: ['./fuel-assignment-table.component.css'],
})
export class FuelAssignmentTableComponent implements OnInit {
  fuelRecords: FuelRecord[] = [];
  teamMembers: TeamMember[] = [];  // Aquí almacenaremos los miembros del equipo con la información de la máquina y el empleado.
  totalFuel: number = 0;
  totalCost: number = 0;
  loading: boolean = true;
  showExportMenu: boolean = false; // Para mostrar u ocultar el menú de exportación

  @ViewChild('table', { static: false }) table: any;  // Referencia a la tabla
  @ViewChild('exportMenu', { static: false }) exportMenu!: ElementRef;

  constructor(private firestore: Firestore, private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.loadFuelRecords();
    this.loadTeamMembers();
  }

  private loadFuelRecords(): void {
    const fuelCollection = collection(this.firestore, 'machineFuelTotals');
    collectionData(fuelCollection, { idField: 'machineId' }).subscribe(
      (data: any[]) => {
        this.fuelRecords = data.map((doc: any) => ({
          machineId: doc.machineId,
          machineType: doc.machineType,
          totalFuelAssigned: doc.totalFuelAssigned || 0,
          dateAssigned: doc.dateAssigned, // Asegúrate de que el campo existe en Firestore
          monthlyTotals: doc.monthlyTotals || {},
        }));
        this.loading = false; // Cambia el estado a falso cuando los datos estén listos
        // Calcular los totales de combustible y costo
        this.totalFuel = this.fuelRecords.reduce((sum, record) => sum + record.totalFuelAssigned, 0);
        this.totalCost = this.totalFuel * 4.91; // Costo basado en el valor por litro de combustible
      
      }
    );
  }

  // Nueva función para cargar los miembros del equipo
  private async loadTeamMembers(): Promise<void> {
    const projectsCollection = collection(this.firestore, 'projects');
    const querySnapshot = await getDocs(projectsCollection);

    querySnapshot.forEach(async (docSnap) => {
      const projectName = docSnap.data()?.['name'];  // Obtener el nombre del proyecto
      const teamCollection = collection(docSnap.ref, 'team');
      const teamSnapshot = await getDocs(teamCollection);

      teamSnapshot.forEach((teamDoc) => {
        const teamData = teamDoc.data();
        if (teamData?.['maquina']?.id) {
          this.teamMembers.push({
            machineId: teamData['maquina'].id,
            employeeName: teamData['nombre'], // El nombre del empleado está en el campo "nombre"
            projectName: projectName || 'Proyecto',  // Agregar el nombre del proyecto
            startHour: teamData['horaInicio'] || 'Hora',  // Recuperar hora de inicio
            endHour: teamData['horaFin'] || 'Hora',  // Recuperar hora de fin
          });
        }
      });
    });
  }

  getEmployeeName(machineId: string): string {
    const member = this.teamMembers.find(
      (teamMember) => teamMember.machineId === machineId
    );
    return member ? member.employeeName : 'Emplead@';
  }

  getProjectName(machineId: string): string {
    const member = this.teamMembers.find(
      (teamMember) => teamMember.machineId === machineId
    );
    return member ? member.projectName : 'Proyecto';
  }

  getStartHour(machineId: string): string {
    const member = this.teamMembers.find(
      (teamMember) => teamMember.machineId === machineId
    );
    return member ? member.startHour : 'Hora';
  }

  getEndHour(machineId: string): string {
    const member = this.teamMembers.find(
      (teamMember) => teamMember.machineId === machineId
    );
    return member ? member.endHour : 'Hora';
  }

  formatDate(timestamp: Timestamp): string {
    if (!timestamp) return ''; // Verificación en caso de valor indefinido
    const date = timestamp.toDate(); // Convertir Timestamp de Firestore a Date
    
    // Obtener el día, mes y año
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses comienzan desde 0, así que sumamos 1
    const year = String(date.getFullYear()).slice(-2); // Obtener solo los dos últimos dígitos del año
    
    return `${day}/${month}/${year}`;
  }
  

  getMonths(record: FuelRecord): string[] {
    return record.monthlyTotals ? Object.keys(record.monthlyTotals) : [];
  }

 // Mostrar/ocultar el menú de exportación
 toggleExportMenu(event: Event): void {
  event.stopPropagation(); // Evita que el clic cierre inmediatamente el menú
  this.showExportMenu = !this.showExportMenu;
}

formatHour(hour: string): string {
  const [hourStr, minuteStr] = hour.split(":");
  const hourInt = parseInt(hourStr, 10);
  const minuteInt = parseInt(minuteStr, 10);
  
  const suffix = hourInt >= 12 ? 'PM' : 'AM';
  let formattedHour = hourInt % 12;
  if (formattedHour === 0) {
    formattedHour = 12; // Para mostrar 12 en vez de 0
  }

  const formattedMinute = minuteInt < 10 ? `0${minuteInt}` : minuteInt;

  return `${formattedHour}:${formattedMinute} ${suffix}`;
}


 // Detectar clics fuera del menú
 @HostListener('document:click', ['$event'])
 onClickOutside(event: Event): void {
   if (
     this.exportMenu &&
     !this.exportMenu.nativeElement.contains(event.target)
   ) {
     this.showExportMenu = false; // Cierra el menú si el clic está fuera
   }
 }

  // Exportar la tabla como imagen
  exportAsImage(): void {
    html2canvas(this.table.nativeElement).then((canvas) => {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'tabla_combustible.png';
      link.click();
    });
  }

  // Exportar la tabla como archivo Excel
  exportAsExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(this.table.nativeElement);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Combustible');
    XLSX.writeFile(wb, 'tabla_combustible.xlsx');
  }

  // Exportar la tabla como archivo CSV
  exportAsCSV(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(this.table.nativeElement);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    FileSaver.saveAs(blob, 'tabla_combustible.csv');
  }

  // Exportar la tabla como archivo PDF
  exportAsPDF(): void {
    const doc = new jsPDF();
    doc.autoTable({ html: this.table.nativeElement });
    doc.save('tabla_combustible.pdf');
  }
}
