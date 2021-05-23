import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { ScrapedPostDto } from '../models';

@Component({
  selector: 'ss-posts-display',
  templateUrl: './posts-display.component.html',
  styleUrls: ['./posts-display.component.scss']
})
export class PostsDisplayComponent implements OnInit {

  @Input() posts: ScrapedPostDto[] = [];
  @Output() deletePost: EventEmitter<ScrapedPostDto> = new EventEmitter();
  @Output() refreshPost: EventEmitter<ScrapedPostDto> = new EventEmitter();

  constructor(
    private elementRef: ElementRef
  ) { }

  ngOnInit() {
  }

}
