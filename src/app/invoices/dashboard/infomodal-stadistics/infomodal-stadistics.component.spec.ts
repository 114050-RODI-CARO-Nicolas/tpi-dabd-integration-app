import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfomodalStadisticsComponent } from './infomodal-stadistics.component';

describe('InfomodalStadisticsComponent', () => {
  let component: InfomodalStadisticsComponent;
  let fixture: ComponentFixture<InfomodalStadisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfomodalStadisticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfomodalStadisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
