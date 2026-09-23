import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { YogaService } from '../../services/yoga.service';
import { CommonModule } from '@angular/common';
import { Routine, Pose, BreathRoutine } from '../../models/yoga.model';

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
  imports: [CommonModule, FormsModule, MatCardModule, MatSelectModule, MatButtonModule],
  templateUrl: './routine-builder.component.html',
  styleUrl: './routine-builder.component.css'
})
export class RoutineBuilderComponent implements OnInit {
  groupedRoutines: { goal: string, routines: Routine[] }[] = [];
  selectedRoutineId: string = '';
  
  routines: Routine[] = [];

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

  generateRoutine() {
    const selectedRoutine = this.routines.find(r => r.id === this.selectedRoutineId);

    if (selectedRoutine) {
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
}
