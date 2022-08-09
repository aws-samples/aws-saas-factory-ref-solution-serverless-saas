/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { TenantsService } from '../tenants/tenants.service';

interface DataSet {
  label: string;
  data: number[];
}
interface ChartData {
  tenantId: string;
  dataSet: DataSet[];
  totalOrders: number;
}

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  selector: 'app-dashboard',
})
export class DashboardComponent implements OnInit {
  constructor(private tenantSvc: TenantsService) {}

  data: ChartData[] = [];

  // lineChart
  public lineChartElements = 27;
  public lineChartData1: Array<number> = [];
  public lineChartData2: Array<number> = [];
  public lineChartData3: Array<number> = [];

  public lineChartData: Array<any> = [
    {
      data: this.lineChartData1,
      label: 'Current',
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)',
      fill: 'origin',
    },
    {
      data: this.lineChartData2,
      label: 'Previous',
      backgroundColor: 'rgba(77,83,96,0.2)',
      borderColor: 'rgba(77,83,96,1)',
      pointBackgroundColor: 'rgba(77,83,96,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(77,83,96,1)',
      fill: 'origin',
    },
    {
      data: this.lineChartData3,
      label: 'BEP',
      backgroundColor: 'rgba(255,0,0,0.3)',
      borderColor: 'red',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)',
      fill: 'origin',
    },
  ];

  public lineChartLegend = false;
  /* tslint:disable:max-line-length */
  public lineChartLabels: Array<any> = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
    'Monday',
    'Thursday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  /* tslint:enable:max-line-length */

  public lineChartType: ChartType = 'line';

  public lineChartOptions: ChartConfiguration['options'] = {
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.5,
      },
    },
    scales: {
      // We use this empty structure as a placeholder for dynamic theming.
      x: {},
      'y-axis-0': {
        position: 'left',
      },
      'y-axis-1': {
        position: 'right',
        grid: {
          color: 'rgba(80,80,80,0.3)',
        },
        ticks: {
          color: '#808080',
        },
      },
    },
  };

  public random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  ngOnInit(): void {
    for (let i = 0; i <= this.lineChartElements; i++) {
      this.lineChartData1.push(this.random(50, 200));
      this.lineChartData2.push(this.random(80, 100));
      this.lineChartData3.push(65);
    }
  }
}
