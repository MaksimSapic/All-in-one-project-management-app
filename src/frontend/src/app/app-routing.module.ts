import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterComponent } from './Components/register/register.component';
import { LoginComponent } from './Components/login/login.component';
import { UserInfoComponent } from './Components/user-info/user-info.component';
import { AdminComponent } from './Components/admin/admin.component';
import { adminGuard } from './_guards/admin.guard';
import { loginGuard } from './_guards/login.guard';
import { authGuard } from './_guards/auth.guard';
import { MyProjectsComponent } from './Components/my-projects/my-projects.component';
import { ForgotPassComponent } from './Components/forgot-pass/forgot-pass.component';
import { ForgotResetComponent } from './Components/forgot-reset/forgot-reset.component';
import { ProjectDetailComponent } from './Components/project-detail/project-detail.component';
import { MyTasksComponent } from './Components/my-tasks/my-tasks.component';
import { userGuard } from './_guards/user.guard';
import { projectGuard } from './_guards/project.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent, title: 'Register', canActivate: [loginGuard] },
  { path: 'login', component: LoginComponent, title: 'Login', canActivate: [loginGuard] },
  { path: 'forgotpass', component: ForgotPassComponent, title: 'Forgot Password', canActivate: [loginGuard] },
  { path: 'forgotreset', component: ForgotResetComponent, title: 'Reset Password', canActivate: [loginGuard] },
  { path: 'project/:id', component: ProjectDetailComponent, title: 'Project Details', canActivate: [authGuard, projectGuard] },
  { path: 'admin', component: AdminComponent, title: 'Admin Panel', canActivate: [adminGuard] },
  { path: 'userinfo', component: UserInfoComponent, title: 'User Information', canActivate: [userGuard] },
  {
    path: '',
    runGuardsAndResolvers: 'always',
    canActivate: [authGuard],
    children: [  
      { path: 'myprojects', component: MyProjectsComponent, title: 'My Projects'},
      { path: 'mytasks', component: MyTasksComponent, title: 'My Tasks' }
    ],
  },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}