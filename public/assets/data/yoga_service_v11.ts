import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { YogaDatabase, Routine, Pose, BreathRoutine, RoutineCategory } from './yoga_model_v11';

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
   * Obtiene la lista completa de rutinas.
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
   * Obtiene el catálogo completo de 60 posturas con instrucciones paso a paso e imágenes.
   */
  getAllPoses(): Observable<Pose[]> {
    return this.getDatabase().pipe(
      map(db => db.poses)
    );
  }

  /**
   * Obtiene una postura específica por su ID.
   */
  getPoseById(id: string): Observable<Pose | undefined> {
    return this.getAllPoses().pipe(
      map(poses => poses.find(p => p.id === id))
    );
  }

  /**
   * Obtiene las técnicas de Pranayama con sus instrucciones e imágenes.
   */
  getBreathRoutines(): Observable<BreathRoutine[]> {
    return this.getDatabase().pipe(
      map(db => db.breathRoutines)
    );
  }

  /**
   * Selecciona una técnica de Pranayama aleatoria para el inicio de la clase.
   */
  getRandomPranayama(): Observable<BreathRoutine> {
    return this.getBreathRoutines().pipe(
      map(list => list[Math.floor(Math.random() * list.length)])
    );
  }
}
