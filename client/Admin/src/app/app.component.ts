import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  template: ` <amplify-authenticator [hideSignUp]="true">
    <ng-template
      amplifySlot="authenticated"
      let-user="user"
      let-signOut="signOut"
    >
      <router-outlet></router-outlet>
    </ng-template>
  </amplify-authenticator>`,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.matIconRegistry.addSvgIcon(
      'saas-commerce',
      this.domSanitizer.bypassSecurityTrustResourceUrl('./assets/logo.svg')
    );
  }
  title = 'dashboard';
}
