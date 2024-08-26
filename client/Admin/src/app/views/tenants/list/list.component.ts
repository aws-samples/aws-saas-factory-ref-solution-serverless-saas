import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Tenant } from '../models/tenant';
import { TenantsService } from '../tenants.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  tenants$ = new Observable<Tenant[]>();
  tenantData = [];
  isLoading: boolean = true;
  displayedColumns = [
    'tenantId',
    'tenantName',
    'tenantEmail',
    'tenantTier',
    'isActive',
  ];
  constructor(private tenantSvc: TenantsService) {}

  ngOnInit(): void {
    this.tenantSvc.fetch().subscribe((response:any) => {
      //console.log('data: ', response.data);
      this.tenantData = response.data;
      this.isLoading = false;
    });
  }
}
