import { NgModule, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RegisterComponent } from './Components/register/register.component';
import { LoginComponent } from './Components/login/login.component';
import { CommonModule, DatePipe } from '@angular/common';
import { UserInfoComponent } from './Components/user-info/user-info.component';
import { NavComponent } from './Components/nav/nav.component';
import { AdminComponent } from './Components/admin/admin.component';
import { ForgotPassComponent } from './Components/forgot-pass/forgot-pass.component';
import { ForgotResetComponent } from './Components/forgot-reset/forgot-reset.component';
import { MyProjectsComponent } from './Components/my-projects/my-projects.component';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MyTasksComponent } from './Components/my-tasks/my-tasks.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ProjectDetailComponent } from './Components/project-detail/project-detail.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { PopupComponent } from './Components/popup/popup.component';
import { KanbanComponent } from './Components/kanban/kanban.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { GanttComponent } from './Components/gantt/gantt.component';
import { ProjectCardComponent } from './Components/project-card/project-card.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AvatarModule } from 'ngx-avatars';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationsComponent } from './Components/notifications/notifications.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { GANTT_GLOBAL_CONFIG, NgxGanttModule } from '@worktile/gantt';
import { TooltipModule } from 'primeng/tooltip';
import { CalendarModule } from 'primeng/calendar';
import { CustomToastComponent } from './Components/custom-toast/custom-toast.component';
import { enUS } from 'date-fns/locale';
import { QuillModule } from 'ngx-quill';

const avatarColors = ["#4BC5BF", "#5d57c2", "#B84BC5", "#25BA17", "#EDEC07","#07AFED"]; // bespotrebno al me mrzi da trazim gde sve trebam da izbacujem

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    UserInfoComponent,
    NavComponent,
    AdminComponent,
    ForgotPassComponent,
    ForgotResetComponent,
    MyProjectsComponent,
    MyTasksComponent,
    PopupComponent,
    ProjectDetailComponent,
    KanbanComponent,
    GanttComponent,
    ProjectCardComponent,
    NotificationsComponent,
    CustomToastComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    CommonModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-right',
    }),
    NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' }),
    DragDropModule,
    ModalModule.forRoot(),
    MatDatepickerModule,
    MultiSelectModule,
    NgSelectModule,
    AvatarModule.forRoot({
      colors: avatarColors
    }),
    ButtonsModule.forRoot(),
    ImageCropperModule,
    NgxGanttModule,
    TooltipModule,
    CalendarModule,
    QuillModule.forRoot()
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    DatePipe,
    provideAnimationsAsync(),
    {
      provide: GANTT_GLOBAL_CONFIG,
      useValue: {
        dateOptions: {
             locale: enUS,
             weekStartsOn: 1
        }
      }
    }
  ],
  bootstrap: [AppComponent],
  
})
export class AppModule {}
