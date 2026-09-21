import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutineDisplayComponent } from './routine-display.component';

describe('RoutineDisplayComponent', () => {
  let component: RoutineDisplayComponent;
  let fixture: ComponentFixture<RoutineDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutineDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutineDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
