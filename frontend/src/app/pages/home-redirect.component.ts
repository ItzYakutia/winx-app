import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ModeService } from '../core/services/mode.service';

@Component({ selector: 'app-home-redirect', standalone: true, template: '' })
export class HomeRedirectComponent {
  constructor(router: Router, mode: ModeService) { void router.navigateByUrl(mode.home(), { replaceUrl: true }); }
}
