import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Component({
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  protected accessToken: string = ""
  protected idToken: string = ""
  protected userData: string = ""
  protected isAuthenticated: boolean = false;
  constructor(
    private authService: AuthService
    ) {}

  ngOnInit() {
    this.authService.checkAuth().subscribe((loginResponse) => {
      this.accessToken = loginResponse.accessToken;
      this.idToken = loginResponse.idToken;
      this.isAuthenticated = loginResponse.isAuthenticated;
      this.userData = loginResponse.userData;
    });
  }

  logout() {
    this.authService.logout();
  }
}
