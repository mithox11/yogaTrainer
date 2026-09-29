import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { YogaDatabase, Routine, Pose, BreathRoutine, RoutineCategory } from './yoga_model_master';

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
   * Obtiene el catálogo completo de las 28 rutinas de 60 min máximo.
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
   * Obtiene el catálogo completo de las 60 posturas con imágenes e instrucciones por lado.
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
   * Obtiene las 8 rutinas de respiración (Pranayama) con imágenes dedicadas e instrucciones paso a paso.
   */
  getBreathRoutines(): Observable<BreathRoutine[]> {
    return this.getDatabase().pipe(
      map(db => db.breathRoutines)
    );
  }

  /**
   * Obtiene una técnica de Pranayama aleatoria para iniciar dinámicamente cualquier clase.
   */
  getRandomPranayama(): Observable<BreathRoutine> {
    return this.getBreathRoutines().pipe(
      map(breathList => breathList[Math.floor(Math.random() * breathList.length)])
    );
  }
}
