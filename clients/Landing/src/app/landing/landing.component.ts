/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { AfterViewChecked, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CollapseDirective } from 'ngx-bootstrap/collapse';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: [
    './landing.component.scss'
  ]
})
export class LandingComponent implements OnInit, AfterViewChecked {
  isAuthenticated$: Observable<boolean>;

  constructor(
    private renderer: Renderer2,
    private router: Router,
  ) { }

  private isCollapsed = true;

  set IsCollapsed(value) {
    this.isCollapsed = value;
  }

  get IsCollapsed() {
    if (this.collapseRef) {
      // temp fix for "overflow: hidden"
      if (getComputedStyle(this.collapseRef.nativeElement).getPropertyValue('display') === 'flex') {
       this.renderer.removeStyle(this.collapseRef.nativeElement, 'overflow');
      }
    }
    return this.isCollapsed;
  }

  @ViewChild(CollapseDirective, { read: ElementRef, static: false }) collapse !: CollapseDirective;
  collapseRef;

  ngOnInit() {
  }

  ngAfterViewChecked(): void {
    this.collapseRef = this.collapse;
  }

  register() {
    this.router.navigate(['register']);
    return false;
  }

}
