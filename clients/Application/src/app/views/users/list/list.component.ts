/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../models/user';
import { UsersService } from '../users.service';

@Component({
  selector: 'app-user',
  templateUrl: './list.component.html',
  styles: [],
})
export class ListComponent implements OnInit {
  users: Observable<User[]>;

  constructor(private userSvc: UsersService) {
    this.users = userSvc.fetch();
  }

  ngOnInit(): void {}
}
