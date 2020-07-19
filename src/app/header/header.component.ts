import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ss-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @Input() loading: number;
  @Input() statusMessage: string;

  constructor() { }

  ngOnInit() {
  }

}
