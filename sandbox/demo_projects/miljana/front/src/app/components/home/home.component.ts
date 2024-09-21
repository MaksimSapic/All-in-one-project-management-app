import { Component, OnInit } from '@angular/core';
import { AppUser } from 'src/app/models/user';
import { HomeService } from 'src/app/services/home.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  [x: string]: any;

  constructor(private homeService:HomeService){}

  users!: AppUser[]

  ngOnInit(): void {
   this.dajSve()
  }

  dajSve():void{
    // this['http'].get('https://localhost:5001/api/users').subscribe({
      
    // })
    // this['http'].get('https://localhost:5001/api/users').subscribe({
    // })
    this.homeService.getAll().subscribe(res=>{
        this.users=res;
        console.log(res)
    })
  }
  

}
