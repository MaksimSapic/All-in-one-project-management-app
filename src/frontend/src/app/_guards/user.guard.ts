import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../_services/login.service';
import { inject } from '@angular/core';

export const userGuard: CanActivateFn = async (route, state) => {
  const service=inject(LoginService);
  const router=inject(Router)

  if(await service.checkToken())
  {
    return true
  }
  else{
    router.navigate(['/login']);
    return false;
  }
};