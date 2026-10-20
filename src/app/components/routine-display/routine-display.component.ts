import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { YogaService } from '../../services/yoga.service';
import { Routine, Pose, BreathRoutine, DisplayPose } from '../../models/yoga.model';

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
    this.currentIndex = 0;
    this.totalRoutineSeconds = this.routine.reduce((total, pose) => total + (pose.durationSeconds || 60), 0);
    this.setupCurrentPose();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  get currentPose(): DisplayPose | null {
    if (this.isFinished) return null;
    return this.routine[this.currentIndex];
  }

  get isSavasana(): boolean {
    if (!this.currentPose) return false;
    const id = (this.currentPose.id || '').toLowerCase();
    const sanskrit = (this.currentPose.nameSanskrit || '').toLowerCase();
    const spanish = (this.currentPose.nameSpanish || '').toLowerCase();
    const phase = (this.currentPose.phaseName || '').toLowerCase();
    return id.includes('savasana') || 
           sanskrit.includes('savasana') || 
           spanish.includes('savasana') ||
           spanish.includes('relajación final') ||
           phase.includes('savasana');
  }

  get respiracionesText(): string {
    if (!this.currentPose) return '5 Respiraciones';
    let dur = (this.currentPose.durationString || '').trim();
    if (!dur && this.currentPose.recommendedDuration) {
      dur = this.currentPose.recommendedDuration.trim();
    }
    if (!dur) return '5 Respiraciones';

    // Remove redundant side instructions that are displayed in the banner
    dur = dur.replace(/\s*\(lado izquierdo.*?\)/i, '');
    // Remove pose name repetitions in parentheses like (Cobra en Saludo al Sol)
    dur = dur.replace(/\s*\([^)]*\)/g, '');
    dur = dur.trim();

    // Capitalize keywords for display
    dur = dur.replace(/respiraciones/i, 'Respiraciones');
    dur = dur.replace(/ciclos respiratorios/i, 'Ciclos respiratorios');
    dur = dur.replace(/ciclos/i, 'Ciclos');
    dur = dur.replace(/vinyasa/i, 'Vinyasa');

    return dur || '5 Respiraciones';
  }

  get formattedTimeLeft(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  get pastPoseItem(): DisplayPose | null {
    if (this.isFinished || this.currentIndex <= 0) return null;
    return this.routine[this.currentIndex - 1];
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
    if (!this.routine || this.routine.length === 0) return 0;
    if (this.isFinished) return 100;

    const totalPoses = this.routine.length;
    const baseProgress = (this.currentIndex / totalPoses) * 100;
    const poseWeight = 100 / totalPoses;

    if (this.isSavasana && this.currentPose && this.currentPose.durationSeconds) {
      const elapsed = this.currentPose.durationSeconds - this.timeLeft;
      const fraction = Math.min(1, Math.max(0, elapsed / this.currentPose.durationSeconds));
      return Math.min(100, baseProgress + (fraction * poseWeight));
    }

    return Math.min(100, baseProgress + (poseWeight * 0.4));
  }

  setupCurrentPose() {
    this.stopTimer();
    if (this.isSavasana) {
      this.timeLeft = this.currentPose?.durationSeconds || 300;
      this.isPlaying = true;
      this.startTimer();
    } else {
      this.timeLeft = this.currentPose?.durationSeconds || 60;
      this.isPlaying = false;
    }
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
      this.currentIndex = index;
      this.setupCurrentPose();
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
    this.playBellSound();
    if (this.currentIndex < this.routine.length - 1) {
      this.currentIndex++;
      this.setupCurrentPose();
    } else {
      this.finishRoutine();
    }
  }

  previousPose() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.setupCurrentPose();
    }
  }

  finishRoutine() {
    this.isFinished = true;
    this.isPlaying = false;
    this.stopTimer();
  }

  startTimer() {
    this.stopTimer();
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
      this.timerInterval = null;
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
