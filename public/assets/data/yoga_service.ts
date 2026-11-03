import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { YogaDatabase, Routine, Pose, BreathRoutine, RoutineCategory } from './yoga_model_v12';

@Injectable({
  providedIn: 'root'
})
export class YogaService {
  private readonly dataUrl = 'assets/data/yoga_data_master.json';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la base de datos maestra completa de Yoga.
   */
  getDatabase(): Observable<YogaDatabase> {
    return this.http.get<YogaDatabase>(this.dataUrl);
  }

  /**
   * Obtiene la lista completa de las 60 rutinas estructuradas.
   */
  getAllRoutines(): Observable<Routine[]> {
    return this.getDatabase().pipe(
      map(db => db.routines)
    );
  }

  /**
   * Filtra las rutinas por estilo de yoga:
   * 'Hatha Yoga', 'Vinyasa Yoga', 'Yin Yoga', etc.
   */
  getRoutinesByStyle(style: string): Observable<Routine[]> {
    return this.getAllRoutines().pipe(
      map(routines => routines.filter(r => r.style.toLowerCase().includes(style.toLowerCase())))
    );
  }

  /**
   * Filtra las rutinas por su meta u objetivo pedagógico
   * ('Relaxation', 'Core Strength', 'Balance and Flexibility', 'Flexibility', etc.).
   */
  getRoutinesByCategory(category: RoutineCategory): Observable<Routine[]> {
    return this.getAllRoutines().pipe(
      map(routines => routines.filter(r => r.category === category))
    );
  }

  /**
   * Obtiene una rutina específica por su identificador único.
   */
  getRoutineById(id: string): Observable<Routine | undefined> {
    return this.getAllRoutines().pipe(
      map(routines => routines.find(r => r.id === id))
    );
  }

  /**
   * Obtiene el catálogo completo de las 60 posturas anatómicas.
   */
  getAllPoses(): Observable<Pose[]> {
    return this.getDatabase().pipe(
      map(db => db.poses)
    );
  }

  /**
   * Obtiene una postura por su ID único.
   */
  getPoseById(id: string): Observable<Pose | undefined> {
    return this.getAllPoses().pipe(
      map(poses => poses.find(p => p.id === id))
    );
  }

  /**
   * Obtiene las 8 técnicas de respiración (Pranayama).
   */
  getBreathRoutines(): Observable<BreathRoutine[]> {
    return this.getDatabase().pipe(
      map(db => db.breathRoutines)
    );
  }

  /**
   * Selecciona una técnica de respiración aleatoria para iniciar la clase.
   */
  getRandomPranayama(): Observable<BreathRoutine> {
    return this.getBreathRoutines().pipe(
      map(routines => routines[Math.floor(Math.random() * routines.length)])
    );
  }
}
