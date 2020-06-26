import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DateAgoPipe } from './pipes/date-ago.pipe';
import { PostInfoWindowComponent } from './post-info-window/post-info-window.component';

@NgModule({
   declarations: [
      AppComponent,
      PostInfoWindowComponent,
      DateAgoPipe
   ],
   imports: [
      BrowserModule,
      AppRoutingModule,
      GoogleMapsModule,
      HttpClientModule
   ],
   providers: [],
   bootstrap: [
      AppComponent
   ]
})
export class AppModule { }
