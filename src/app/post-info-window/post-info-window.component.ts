import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { ScrapedPostDto } from '../models';


@Component({
  selector: 'ss-post-info-window',
  templateUrl: './post-info-window.component.html',
  styleUrls: ['./post-info-window.component.scss']
})
export class PostInfoWindowComponent implements OnInit {

  @Input() post: ScrapedPostDto;
  @Output() deletePost: EventEmitter<ScrapedPostDto> = new EventEmitter();
  @Output() refreshPost: EventEmitter<ScrapedPostDto> = new EventEmitter();

  public isAdmin: boolean = !!sessionStorage.getItem('ADMIN');

  showCaption: boolean = false;

  constructor() { }

  ngOnInit() {
  }

}
