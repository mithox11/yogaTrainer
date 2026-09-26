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
   * Obtiene la base de datos completa de Yoga.
   */
  getDatabase(): Observable<YogaDatabase> {
    return this.http.get<YogaDatabase>(this.dataUrl);
  }

  /**
   * Obtiene la lista completa de las 25 rutinas organizadas en 4 fases.
   */
  getAllRoutines(): Observable<Routine[]> {
    return this.getDatabase().pipe(
      map(db => db.routines)
    );
  }

  /**
   * Filtra las rutinas por su categoría / meta específica.
   */
  getRoutinesByCategory(category: RoutineCategory): Observable<Routine[]> {
    return this.getAllRoutines().pipe(
      map(routines => routines.filter(r => r.category === category))
    );
  }

  /**
   * Obtiene el catálogo completo de las 60 posturas con sus instrucciones de Lado Izquierdo y Lado Derecho.
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
   * Obtiene las rutinas de respiración (Pranayama) con sus imágenes e instrucciones.
   */
  getBreathRoutines(): Observable<BreathRoutine[]> {
    return this.getDatabase().pipe(
      map(db => db.breathRoutines)
    );
  }

  /**
   * Selecciona una técnica de Pranayama de forma aleatoria para el inicio de la clase.
   */
  getRandomPranayama(): Observable<BreathRoutine> {
    return this.getBreathRoutines().pipe(
      map(list => list[Math.floor(Math.random() * list.length)])
    );
  }
}
