import { Component,OnInit } from '@angular/core';
import { RouterOutlet,RouterLink } from '@angular/router';
import { HtmlContentService } from './service/htmlcontent/htmlcontent.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit  {
   contents: any[] = [];

  constructor(private contentService: HtmlContentService) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe(data => {
      this.contents = data;
    });
  }
  title = 'first-angular-app';
}
