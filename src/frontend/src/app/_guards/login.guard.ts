import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../_services/login.service';

export const loginGuard: CanActivateFn = async (route, state) => {
  const service=inject(LoginService);
  const router=inject(Router)

  if(await service.checkToken()===true){
    if(localStorage.getItem('role')==='0')
      router.navigate(['/admin']);
    else {
      router.navigate(['/mytasks']);
      localStorage.setItem('selectedOption', 'MyTasks');
    }
      return false;
  }
  else {
    localStorage.removeItem('token');
    localStorage.removeItem('id');
    localStorage.removeItem('role');
    localStorage.removeItem('selectedOption');
    return true;
  }

};