import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LibAuthwatchService } from 'projects/shared-services/lib-authwatch.service';
import { DOCUMENT } from '@angular/common';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit, OnDestroy {

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private authWatchService: LibAuthwatchService,
    private meta: Meta
    // private router: Router
  ) { }

  ngOnInit() {
    this.meta.updateTag({
      name: 'robots',
      content: 'noindex'
    });
    this.authWatchService.signOut().subscribe(() => {
      this.document.location.href = '/';
    });

  }


  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.meta.removeTag("name='robots'");
  }

}
