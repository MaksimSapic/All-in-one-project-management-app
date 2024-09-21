import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../_services/login.service';
import { inject } from '@angular/core';
import { AdminService } from '../_services/admin.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const service=inject(LoginService);
  const router=inject(Router)
  const adminService=inject(AdminService)

  if(await service.checkToken())
  {
    if(await adminService.check()===true)
    {
      router.navigate(['/admin']);
      return false
    }
     return true
  }
  else {
    localStorage.removeItem('token');
    localStorage.removeItem('id');
    localStorage.removeItem('role');
    localStorage.removeItem('selectedOption');
    router.navigate(['/login']);
    return false;
  }
};