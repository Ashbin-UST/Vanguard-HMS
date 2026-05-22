import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Activity } from '../models/activity.model';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.css']
})
export class ActivityComponent {
  @Input() activities: Activity[] = [];
  @Input() mode: 'compact' | 'timeline' = 'compact';
  @Input() limit?: number;

  get visibleActivities(): Activity[] {
    return this.limit ? this.activities.slice(0, this.limit) : this.activities;
  }
}
