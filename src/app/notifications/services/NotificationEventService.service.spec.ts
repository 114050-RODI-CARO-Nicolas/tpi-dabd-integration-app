/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { NotificationEventServiceService } from './NotificationEventService.service';

describe('Service: NotificationEventService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationEventServiceService]
    });
  });

  it('should ...', inject([NotificationEventServiceService], (service: NotificationEventServiceService) => {
    expect(service).toBeTruthy();
  }));
});
