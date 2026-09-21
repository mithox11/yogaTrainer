import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutineBuilderComponent } from './routine-builder.component';

describe('RoutineBuilderComponent', () => {
  let component: RoutineBuilderComponent;
  let fixture: ComponentFixture<RoutineBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutineBuilderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutineBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
