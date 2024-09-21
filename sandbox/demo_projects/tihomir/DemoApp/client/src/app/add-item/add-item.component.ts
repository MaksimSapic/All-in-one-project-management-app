import { Component } from '@angular/core';
import { AddItemRequest } from '../models/add-item-request.model';
import { ItemService } from '../services/item.service';

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.css']
})
export class AddItemComponent {

  model: AddItemRequest;

  constructor(private itemService: ItemService) {
    this.model = {
      title: ''
    };
  }

  onFormSubmit(){
    this.itemService.addItem(this.model).subscribe({
      next: (response) => {
        console.log("Add item was successful");
      } ,
      error: error => console.log(error),
      complete: () => console.log("Request has completed")
    });
  }
}
