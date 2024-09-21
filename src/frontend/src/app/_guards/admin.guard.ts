import { CanActivateFn, Router } from '@angular/router';
import { AdminService } from '../_services/admin.service';
import { inject } from '@angular/core';
import { LoginService } from '../_services/login.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const adminService=inject(AdminService)
  const loginService=inject(LoginService);
  const router=inject(Router)
  
  if(await adminService.check() && await loginService.checkToken())
  {
    return true;
  }
  else {
    router.navigate(['/login']);
    return false;
  }

};