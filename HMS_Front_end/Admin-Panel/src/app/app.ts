import { Component, signal } from '@angular/core';
import { RouterOutlet,RouterLink } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone:true,
  imports: [RouterOutlet,RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angular-tutorial');
  name = "Angular tutorial" 

}
