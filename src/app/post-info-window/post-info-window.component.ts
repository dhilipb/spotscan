import { Component, Input, OnInit } from '@angular/core';
import { InstaPost } from '@shared/models';


@Component({
  selector: 'ss-post-info-window',
  templateUrl: './post-info-window.component.html',
  styleUrls: ['./post-info-window.component.scss']
})
export class PostInfoWindowComponent implements OnInit {

  @Input() post: InstaPost;

  constructor() { }

  ngOnInit() {
  }

}
