import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RolesComponent } from './components/roles/roles.component';
import { EmployeesComponent } from './components/employees/employees.component';
import { WorkHoursComponent } from './components/work-hours/work-hours.component';
import { MachineryComponent } from './components/machinery/machinery.component';
import { LoginComponent } from './components/login/login.component';
import { AssignResourcesComponent } from './components/assign-resources/assign-resources.component'; // Importar AssignResources
import { ProjectComponent } from './components/projects/projects.component';
import { ProjectDetailComponent } from './components/projects/project-detail/project-detail.component'; // Asegúrate de ajustar la ruta

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'roles', component: RolesComponent },
  { path: 'employees', component: EmployeesComponent },
  { path: 'work-hours', component: WorkHoursComponent },
  { path: 'machinery', component: MachineryComponent },
  { path: 'assign-resources', component: AssignResourcesComponent },
  { path: 'projects', component: ProjectComponent },
  { path: 'project/:id', component: ProjectDetailComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirigir al login por defecto
];
