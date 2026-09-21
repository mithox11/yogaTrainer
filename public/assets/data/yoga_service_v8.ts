import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { YogaDatabase, Routine, Pose, BreathRoutine, RoutineCategory } from './yoga_model_v8';

@Injectable({
  providedIn: 'root'
})
export class YogaService {
  private readonly dataUrl = 'assets/data/yoga_data_v8.json';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la base de datos completa de Yoga (v8.0.0 con 50 posturas con imágenes fotorrealistas).
   */
  getDatabase(): Observable<YogaDatabase> {
    return this.http.get<YogaDatabase>(this.dataUrl);
  }

  /**
   * Obtiene la lista completa de rutinas estructuradas en 4 fases sin duplicados.
   */
  getAllRoutines(): Observable<Routine[]> {
    return this.getDatabase().pipe(
      map(db => db.routines)
    );
  }

  /**
   * Filtra las rutinas por su categoría / meta específica
   * ('Relaxation', 'Core Strength', 'Balance and Flexibility', etc.).
   */
  getRoutinesByCategory(category: RoutineCategory): Observable<Routine[]> {
    return this.getAllRoutines().pipe(
      map(routines => routines.filter(r => r.category === category))
    );
  }

  /**
   * Filtra las rutinas por estilo de yoga ('Hatha Yoga', 'Vinyasa Yoga', 'Yin Yoga', etc.).
   */
  getRoutinesByStyle(style: string): Observable<Routine[]> {
    return this.getAllRoutines().pipe(
      map(routines => routines.filter(r => r.style.toLowerCase().includes(style.toLowerCase())))
    );
  }

  /**
   * Obtiene el catálogo completo de las 50 posturas con sus imágenes fotorrealistas asignadas.
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
   * Obtiene las rutinas de respiración (Pranayama).
   */
  getBreathRoutines(): Observable<BreathRoutine[]> {
    return this.getDatabase().pipe(
      map(db => db.breathRoutines)
    );
  }
}
