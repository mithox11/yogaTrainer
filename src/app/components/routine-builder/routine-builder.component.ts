import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { YogaService } from '../../services/yoga.service';
import { CommonModule } from '@angular/common';
import { Routine, Pose } from '../../models/yoga.model';

// Extend Pose for display purposes
export interface DisplayPose extends Pose {
  durationString?: string;
  durationSeconds?: number;
}

@Component({
  selector: 'app-routine-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatSelectModule, MatButtonModule],
  templateUrl: './routine-builder.component.html',
  styleUrl: './routine-builder.component.css'
})
export class RoutineBuilderComponent implements OnInit {
  selectedType: string = 'Hatha';

  // We can expand these based on the actual styles available in the dataset
  types = ['Hatha', 'Vinyasa', 'Yin', 'Vinyasa Dinámico Completo'];
  
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

  generateRoutine() {
    // Filter by type (style) only
    let filteredRoutines = this.routines.filter(r => 
      r.style.toLowerCase().includes(this.selectedType.toLowerCase())
    );

    // If no match, just pick any routine
    if (filteredRoutines.length === 0) {
      filteredRoutines = this.routines;
    }

    if (filteredRoutines.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredRoutines.length);
      const selectedRoutine = filteredRoutines[randomIndex];

      this.yogaService.currentRoutine = selectedRoutine;

      this.yogaService.getAllPoses().subscribe(allPoses => {
        // Flatten poses from phases if they exist, otherwise fallback to posesSequence
        let sequenceItems: any[] = [];
        if (selectedRoutine.phases && selectedRoutine.phases.length > 0) {
           selectedRoutine.phases.forEach(phase => {
             sequenceItems = sequenceItems.concat(phase.poses);
           });
        }

        this.yogaService.currentRoutinePoses = sequenceItems.map(seqItem => {
          const pose = allPoses.find(p => p.id === seqItem.poseId);
          if (pose) {
             const displayPose: DisplayPose = {
                ...pose,
                durationString: seqItem.duration,
                durationSeconds: this.parseDurationString(seqItem.duration)
             };
             return displayPose;
          }
          return null;
        }).filter(p => p !== null) as any;
        
        this.router.navigate(['/play']);
      });
    }
  }
}
