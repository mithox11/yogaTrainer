import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { YogaService } from '../../services/yoga.service';
import { CommonModule } from '@angular/common';
import { Routine, Pose, BreathRoutine, PoseSequenceItem } from '../../models/yoga.model';

// Extend Pose for display purposes
export interface DisplayPose extends Pose {
  durationString?: string;
  durationSeconds?: number;
  phaseName?: string;
  pranayamaDetails?: BreathRoutine;
}

@Component({
  selector: 'app-routine-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './routine-builder.component.html',
  styleUrl: './routine-builder.component.css'
})
export class RoutineBuilderComponent implements OnInit {
  routines: Routine[] = [];

  constructor(
    private yogaService: YogaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.yogaService.getDatabase().subscribe(db => {
      this.routines = db.routines;
    });
  }

  parseDurationString(durationStr: string): number {
    const s = durationStr.toLowerCase();
    if (s.includes('min')) {
        const match = s.match(/(\d+)\s*min/);
        if (match) return parseInt(match[1]) * 60;
    }
    if (s.includes('respiraciones')) {
        const match = s.match(/(\d+)\s*respiraciones/);
        if (match) return parseInt(match[1]) * 6;
    }
    if (s.includes('s')) {
        const match = s.match(/(\d+)\s*s/);
        if (match) return parseInt(match[1]);
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

        const customRoutine: Routine = {
          id: 'custom_random_' + Date.now(),
          title: 'Random ' + yogaType + ' Routine',
          style: yogaType,
          category: 'Exercise',
          durationMinutes: 30,
          level: 'Todos los niveles',
          focus: 'Generated Random Flow',
          description: 'A dynamically generated ' + yogaType + ' routine.',
          breathRoutine: randomBreath.id,
          phases: [
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
          ]
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
                    nameSanskrit: isPranayamaPhase && pranayama ? pranayama.name : p.nameSanskrit
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
