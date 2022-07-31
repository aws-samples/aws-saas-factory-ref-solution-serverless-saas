import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

interface Configuration {
  apiUrl: string;
  stage: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigAssetLoaderService {
  private readonly CONFIG_URL = './assets/config/config.json';
  private configuration$: Observable<Configuration> | undefined;

  constructor(private http: HttpClient) {}

  public loadConfigurations(): Observable<Configuration> {
    console.log('IN LOADCONFIGURATIONS');
    if (!this.configuration$) {
      this.configuration$ = this.http
        .get<Configuration>(this.CONFIG_URL)
        .pipe(shareReplay(1));
    }
    return this.configuration$;
  }
}
