import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { YogaService } from '../../services/yoga.service';
import { Routine, Pose, BreathRoutine } from '../../models/yoga.model';

export interface DisplayPose extends Pose {
  durationString?: string;
  durationSeconds?: number;
  phaseName?: string;
  pranayamaDetails?: BreathRoutine;
}

@Component({
  selector: 'app-routine-display',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressBarModule, MatIconModule, MatSliderModule],
  templateUrl: './routine-display.component.html',
  styleUrl: './routine-display.component.css'
})
export class RoutineDisplayComponent implements OnInit, OnDestroy {
  routine: DisplayPose[] = [];
  currentIndex: number = 0;
  
  isPlaying: boolean = false;
  isFinished: boolean = false;
  timeLeft: number = 0;
  timerInterval: any;
  audioContext: AudioContext | null = null;
  totalRoutineSeconds: number = 0;

  constructor(
    private yogaService: YogaService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.yogaService.currentRoutine || this.yogaService.currentRoutinePoses.length === 0) {
      this.router.navigate(['/']);
      return;
    }
    this.routine = this.yogaService.currentRoutinePoses as DisplayPose[];
    this.timeLeft = this.routine[0].durationSeconds || 60;
    this.totalRoutineSeconds = this.routine.reduce((total, pose) => total + (pose.durationSeconds || 60), 0);
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  get currentPose(): DisplayPose | null {
    if (this.isFinished) return null;
    return this.routine[this.currentIndex];
  }

  get nextPoseItem(): DisplayPose | null {
    if (this.isFinished || this.currentIndex >= this.routine.length - 1) return null;
    return this.routine[this.currentIndex + 1];
  }

  get progress(): number {
    if (!this.currentPose || !this.currentPose.durationSeconds) return 100;
    return ((this.currentPose.durationSeconds - this.timeLeft) / this.currentPose.durationSeconds) * 100;
  }

  get globalProgress(): number {
    if (this.totalRoutineSeconds === 0) return 0;
    
    let elapsed = 0;
    for (let i = 0; i < this.currentIndex; i++) {
      elapsed += (this.routine[i].durationSeconds || 60);
    }
    const currentPoseElapsed = (this.currentPose?.durationSeconds || 60) - this.timeLeft;
    elapsed += currentPoseElapsed;
    
    return (elapsed / this.totalRoutineSeconds) * 100;
  }

  playBellSound() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.5);
      
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 2);
    } catch (e) {
      console.warn('AudioContext not supported or blocked');
    }
  }

  jumpToPose(index: number) {
    if (index >= 0 && index < this.routine.length) {
      this.stopTimer();
      this.currentIndex = index;
      this.timeLeft = this.routine[this.currentIndex].durationSeconds || 60;
      if (this.isPlaying) {
        this.startTimer();
      }
    }
  }

  onSliderChange(value: number) {
    if (this.currentPose && this.currentPose.durationSeconds) {
      this.timeLeft = this.currentPose.durationSeconds - value;
    }
  }

  startRoutine() {
    this.isPlaying = true;
    this.startTimer();
  }

  pauseRoutine() {
    this.isPlaying = false;
    this.stopTimer();
  }

  nextPose() {
    this.stopTimer();
    this.playBellSound();
    if (this.currentIndex < this.routine.length - 1) {
      this.currentIndex++;
      this.timeLeft = this.routine[this.currentIndex].durationSeconds || 60;
      if (this.isPlaying) {
        this.startTimer();
      }
    } else {
      this.finishRoutine();
    }
  }

  previousPose() {
    this.stopTimer();
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.timeLeft = this.routine[this.currentIndex].durationSeconds || 60;
      if (this.isPlaying) {
        this.startTimer();
      }
    }
  }

  finishRoutine() {
    this.isFinished = true;
    this.isPlaying = false;
    this.stopTimer();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.nextPose();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
