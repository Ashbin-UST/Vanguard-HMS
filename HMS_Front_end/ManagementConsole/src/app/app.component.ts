import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// import { ChartComponent } from './dashboard/chart/chart.component';

import { HtmlContentService } from './service/htmlcontent/htmlcontent.service';

@Component({
  selector: 'app-root',
  standalone: true,

  imports: [
    RouterOutlet,
    RouterLink,
    CommonModule,
    HttpClientModule,
    // ChartComponent,
  ],

  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  contents: any[] = [];

  constructor(private contentService: HtmlContentService) {}

  ngOnInit(): void {
    this.contentService.getContent().subscribe(data => {
      this.contents = data;
    });
  }

  title = 'first-angular-app';
}