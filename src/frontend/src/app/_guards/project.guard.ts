import { CanActivateFn, Router } from '@angular/router';
import { ProjectCardService } from '../_services/project-card.service';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';

export const projectGuard: CanActivateFn = (route, state) => {
  
  const service = inject(ProjectCardService);
  const router = inject(Router);
  const idParam = route.paramMap.get('id');
  if (idParam!== null) {
      const projectId = Number(idParam);
       return service.CheckProjectStatus(projectId).pipe(
        map((isArchived) => {
          if (isArchived) {
            router.navigate(['/myprojects']);
            return false;
          } else {         
            return true;
          }
        }),
      );
  
  } else {
    router.navigate(['/myprojects']);
    return false;
    
  }
};