import { Component, Input, OnInit, Output } from '@angular/core';
import { EventEmitter } from 'events';

import { ScrapedPostDto } from '../models';
import { ApiService } from '../services';


@Component({
  selector: 'ss-post-info-window',
  templateUrl: './post-info-window.component.html',
  styleUrls: ['./post-info-window.component.scss']
})
export class PostInfoWindowComponent implements OnInit {

  @Input() post: ScrapedPostDto;
  @Output() deletePost: EventEmitter = new EventEmitter();

  showCaption: boolean = false;

  constructor(
    private apiService: ApiService
  ) { }

  ngOnInit() {
  }

}
