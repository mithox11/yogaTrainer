import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { YogaService } from '../../services/yoga.service';
import { CommonModule } from '@angular/common';
import { Routine, Pose, BreathRoutine, PoseSequenceItem, DisplayPose } from '../../models/yoga.model';

@Component({
  selector: 'app-routine-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './routine-builder.component.html',
  styleUrl: './routine-builder.component.css'
})
export class RoutineBuilderComponent implements OnInit {
  routines: Routine[] = [];
  groupedRoutines: { goal: string; routines: Routine[] }[] = [];
  selectedRoutineId: string = '';

  constructor(
    private yogaService: YogaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.yogaService.getDatabase().subscribe(db => {
      this.routines = db.routines;

      const groupMap = new Map<string, Routine[]>();
      this.routines.forEach(r => {
        const goal = r.category || 'General';
        if (!groupMap.has(goal)) {
          groupMap.set(goal, []);
        }
        groupMap.get(goal)!.push(r);
      });

      this.groupedRoutines = Array.from(groupMap.entries()).map(([goal, routines]) => ({
        goal, routines
      }));

      if (this.routines.length > 0) {
        this.selectedRoutineId = this.routines[0].id;
      }
    });
  }

  startSelectedRoutine() {
    const selected = this.routines.find(r => r.id === this.selectedRoutineId);
    if (selected) {
      this.processRoutineAndNavigate(selected);
    }
  }

  parseDurationString(durationStr: string): number {
    if (!durationStr) return 60;
    const s = durationStr.toLowerCase();

    // Check minutes (e.g. '5 min', '2 minutos', '1 minuto')
    const minMatch = s.match(/(\d+)\s*(?:minutos|minuto|min)/);
    if (minMatch) {
      return parseInt(minMatch[1], 10) * 60;
    }

    // Check series/repetitions with seconds (e.g. '3 series de 30 segundos', '2 rondas de 30s')
    const seriesMatch = s.match(/(\d+)\s*(?:series|repeticiones|rondas)\s+de\s+(\d+)\s*(?:segundos|seg|s)/);
    if (seriesMatch) {
      return parseInt(seriesMatch[1], 10) * parseInt(seriesMatch[2], 10);
    }

    // Check seconds (e.g. '45 segundos', '30s')
    const secMatch = s.match(/(\d+)\s*(?:segundos|seg|s)\b/);
    if (secMatch) {
      return parseInt(secMatch[1], 10);
    }

    // Check breaths/cycles (e.g. '5 respiraciones', '10 ciclos respiratorios', '5-8 respiraciones')
    const breathMatch = s.match(/(\d+)(?:-\d+)?\s*(?:respiraciones|ciclos)/);
    if (breathMatch) {
      return parseInt(breathMatch[1], 10) * 6;
    }

    // Check rounds/vueltas/transiciones
    const roundsMatch = s.match(/(\d+)\s*(?:vueltas|rondas|transiciones)/);
    if (roundsMatch) {
      return parseInt(roundsMatch[1], 10) * 30;
    }

    return 60; // default 60s
  }

  generateRandomRoutine(yogaType: string) {
    this.yogaService.getAllPoses().subscribe(allPoses => {
      this.yogaService.getBreathRoutines().subscribe(breathRoutines => {
        
        const randomBreath = breathRoutines[Math.floor(Math.random() * breathRoutines.length)];
        
        const warmupPosesPool = allPoses.filter(p => p.category.toLowerCase().includes('calentamiento') || p.category.toLowerCase().includes('transición') || p.id === 'adho_mukha_svanasana' || p.id === 'marjaryasana_bitilasana' || p.id === 'bhujangasana' || p.id === 'balasana');
        
        const mainPosesPool = allPoses.filter(p => p.yogaType.toLowerCase().includes(yogaType.toLowerCase()));
        
        // Pick random items
        const pickedWarmup = this.pickRandomPoses(warmupPosesPool, 3);
        const pickedMain = this.pickRandomPoses(mainPosesPool, 5);

        const phases = [
          {
            phaseName: 'Fase 1: Pranayama',
            description: 'Centramiento',
            poses: [{ poseId: 'tadasana', duration: '3 min' }]
          },
          {
            phaseName: 'Fase 2: Saludos al Sol / Calentamiento',
            description: 'Calentamiento dinámico',
            poses: pickedWarmup.map(p => ({ poseId: p.id, duration: '5 respiraciones' }))
          },
          {
            phaseName: 'Fase 3: Rutina Formal',
            description: 'Posturas principales de ' + yogaType,
            poses: pickedMain.map(p => ({ poseId: p.id, duration: '5 respiraciones por lado' }))
          },
          {
            phaseName: 'Fase 4: Savasana',
            description: 'Relajación Final',
            poses: [{ poseId: 'savasana', duration: '5 min' }]
          }
        ];

        const customRoutine: Routine = {
          id: 'custom_random_' + Date.now(),
          title: 'Random ' + yogaType + ' Routine',
          style: yogaType,
          category: 'Exercise',
          durationMinutes: 30,
          durationFormatted: '30 min',
          level: 'Todos los niveles',
          focus: 'Generated Random Flow',
          description: 'A dynamically generated ' + yogaType + ' routine.',
          breathRoutine: randomBreath.id,
          phases: phases,
          posesSequence: phases.flatMap(ph => ph.poses)
        };

        this.processRoutineAndNavigate(customRoutine);
      });
    });
  }

  private pickRandomPoses(pool: Pose[], count: number): Pose[] {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  private processRoutineAndNavigate(selectedRoutine: Routine) {
    this.yogaService.currentRoutine = selectedRoutine;

    this.yogaService.getAllPoses().subscribe(allPoses => {
      this.yogaService.getBreathRoutines().subscribe(breathRoutines => {
        const pranayama = breathRoutines.find(b => b.id === selectedRoutine.breathRoutine);
        let sequenceItems: any[] = [];
        
        if (selectedRoutine.phases && selectedRoutine.phases.length > 0) {
            selectedRoutine.phases.forEach(phase => {
            phase.poses.forEach(seqItem => {
                const p = allPoses.find(x => x.id === seqItem.poseId);
                if (p) {
                const isPranayamaPhase = phase.phaseName.toLowerCase().includes('pranayama');
                sequenceItems.push({
                    ...p,
                    durationString: seqItem.duration,
                    durationSeconds: this.parseDurationString(seqItem.duration),
                    phaseName: phase.phaseName,
                    imageFileName: isPranayamaPhase && pranayama?.imageFileName ? pranayama.imageFileName : p.imageFileName,
                    pranayamaDetails: isPranayamaPhase ? pranayama : undefined,
                    nameSpanish: isPranayamaPhase && pranayama ? pranayama.name : p.nameSpanish,
                    nameSanskrit: isPranayamaPhase && pranayama ? pranayama.name : p.nameSanskrit,
                    sideInstruction: seqItem.sideInstruction,
                    sides: seqItem.sides
                });
                }
            });
            });
        }

        this.yogaService.currentRoutinePoses = sequenceItems;
        this.router.navigate(['/play']);
      });
    });
  }
}
