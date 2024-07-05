/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Component, OnInit } from '@angular/core';
import { User } from '../models/user';
import { UsersService } from '../users.service';

@Component({
  selector: 'app-user',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {
  userData: User[] = [];
  isLoading: boolean = true;
  displayedColumns: string[] = [
    'email',
    'created',
    'modified',
    'status',
    'enabled',
  ];

  constructor(private userSvc: UsersService) {}

  ngOnInit(): void {
    this.userSvc.fetch().subscribe((response: any) => {
      this.userData = response.data;
      this.isLoading = false;
    });
  }
}
