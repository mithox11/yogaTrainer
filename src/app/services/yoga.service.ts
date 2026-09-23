import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { YogaDatabase, Routine, Pose, BreathRoutine, RoutineCategory } from '../models/yoga.model';

@Injectable({
  providedIn: 'root'
})
export class YogaService {
  private readonly dataUrl = 'assets/data/yoga_data_master.json';

  // State to hold the selected routine and its fully resolved poses
  currentRoutine: Routine | null = null;
  currentRoutinePoses: any[] = [];

  constructor(private http: HttpClient) {}

  getDatabase(): Observable<YogaDatabase> {
    return this.http.get<YogaDatabase>(this.dataUrl);
  }

  getAllRoutines(): Observable<Routine[]> {
    return this.getDatabase().pipe(
      map(db => db.routines)
    );
  }

  getRoutinesByCategory(category: RoutineCategory): Observable<Routine[]> {
    return this.getAllRoutines().pipe(
      map(routines => routines.filter(r => r.category === category))
    );
  }

  getRoutinesByStyle(style: string): Observable<Routine[]> {
    return this.getAllRoutines().pipe(
      map(routines => routines.filter(r => r.style.toLowerCase().includes(style.toLowerCase())))
    );
  }

  getAllPoses(): Observable<Pose[]> {
    return this.getDatabase().pipe(
      map(db => db.poses)
    );
  }

  getPoseById(id: string): Observable<Pose | undefined> {
    return this.getAllPoses().pipe(
      map(poses => poses.find(p => p.id === id))
    );
  }

  getBreathRoutines(): Observable<BreathRoutine[]> {
    return this.getDatabase().pipe(
      map(db => db.breathRoutines)
    );
  }

  getRandomPranayama(): Observable<BreathRoutine> {
    return this.getBreathRoutines().pipe(
      map(breathRoutines => breathRoutines[Math.floor(Math.random() * breathRoutines.length)])
    );
  }
}
