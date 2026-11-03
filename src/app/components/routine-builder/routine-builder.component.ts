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

  private buildSequenceItem(pose: Pose, duration: string): PoseSequenceItem {
    const steps = pose.stepByStepInstructions || [];
    const leftStep = steps.find(s => s.includes('Lado Izquierdo:'));
    const rightStep = steps.find(s => s.includes('Lado Derecho:'));

    if (leftStep && rightStep) {
      return {
        poseId: pose.id,
        duration,
        sideInstruction: `Realizar ambos lados: Izquierdo y Derecho (${duration})`,
        sides: {
          left: leftStep.replace(/^\d+\.\s*Lado Izquierdo:\s*/i, '').trim(),
          right: rightStep.replace(/^\d+\.\s*Lado Derecho:\s*/i, '').trim()
        }
      };
    }

    return { poseId: pose.id, duration };
  }

  private isBilateralPose(pose: Pose): boolean {
    const text = (pose.stepByStepInstructions || []).join(' ');
    return text.includes('Lado Izquierdo:') || text.includes('Lado Derecho:') || (pose.recommendedDuration || '').includes('por lado');
  }

  generateRandomRoutine(yogaType: string) {
    this.yogaService.getAllPoses().subscribe(allPoses => {
      this.yogaService.getBreathRoutines().subscribe(breathRoutines => {
        const styleLower = yogaType.toLowerCase();
        const isYin = styleLower.includes('yin');
        const isVinyasa = styleLower.includes('vinyasa');
        const poseMap = new Map<string, Pose>(allPoses.map(p => [p.id, p]));

        let phases: any[] = [];
        let selectedBreath: BreathRoutine = breathRoutines[0];
        let styleTitle = yogaType;
        let focusText = '';
        let descriptionText = '';

        if (isYin) {
          styleTitle = 'Yin Yoga';
          focusText = 'Tejido Conectivo, Fascia y Meridianos';
          descriptionText = 'Rutina de Yin Yoga con músculos fríos, sin Saludos al Sol y permanencias pasivas de 3 a 5 minutos.';

          const yinBreaths = breathRoutines.filter(b =>
            ['respiracion_completa', 'bhramari', 'samavritti', 'nadi_shodhana'].includes(b.id)
          );
          selectedBreath = yinBreaths[Math.floor(Math.random() * yinBreaths.length)] || breathRoutines[0];

          const centeringIds = ['balasana', 'padmasana', 'supta_baddha_konasana'];
          const centeringId = centeringIds[Math.floor(Math.random() * centeringIds.length)];
          const prepId = centeringId === 'supta_baddha_konasana' ? 'sphinx_pose' : 'supta_baddha_konasana';

          const excludedIds = new Set([centeringId, prepId, 'savasana', 'tadasana']);
          const yinPool = allPoses.filter(p =>
            !excludedIds.has(p.id) &&
            (p.yogaType.toLowerCase().includes('yin') || (p.holdTimeByStyle?.yin && p.holdTimeByStyle.yin !== 'N/A'))
          );
          const pickedMain = this.pickRandomPoses(yinPool, 4);

          phases = [
            {
              phaseName: 'Fase 1: Pranayama, Centramiento Meditativo y Respiración Consciente',
              description: 'Respiración consciente en quietud total',
              poses: [{ poseId: centeringId, duration: '5 min centramiento meditativo' }]
            },
            {
              phaseName: 'Fase 2: Preparación Fascial y Apertura Pasiva',
              description: 'Entrada suave a nivel del suelo con músculos fríos y relajados (sin Saludos al Sol)',
              poses: [this.buildSequenceItem(poseMap.get(prepId)!, '5 min apertura pasiva')]
            },
            {
              phaseName: 'Fase 3: Rutina Formal - Tejido Conectivo y Meridianos',
              description: 'Permanencia prolongada de 3 a 5 minutos por postura en el suelo',
              poses: pickedMain.map(p =>
                this.buildSequenceItem(p, this.isBilateralPose(p) ? '4 min por lado' : '4 min')
              )
            },
            {
              phaseName: 'Fase 4: Relajación Final y Rebote Asimilativo (Savasana)',
              description: 'Rehidratación de la matriz extracelular y silencio profundo',
              poses: [{ poseId: 'savasana', duration: '10 min relajación e integración fascial' }]
            }
          ];
        } else if (isVinyasa) {
          styleTitle = 'Vinyasa Yoga';
          focusText = 'Flujo Dinámico Sincronizado (Ujjayi & Vinyasa Krama)';
          descriptionText = 'Secuencia encadenada continua de Vinyasa Flow con Saludos al Sol A y B y transiciones dinámicas.';

          selectedBreath = breathRoutines.find(b => b.id === 'ujjayi') || breathRoutines[0];

          const warmupIds = ['marjaryasana_bitilasana', 'adho_mukha_svanasana', 'chaturanga_dandasana', 'bhujangasana'];
          const excludedIds = new Set([...warmupIds, 'tadasana', 'savasana', 'balasana']);
          const vinyasaPool = allPoses.filter(p =>
            !excludedIds.has(p.id) && p.yogaType.toLowerCase().includes('vinyasa')
          );
          const pickedMain = this.pickRandomPoses(vinyasaPool, 5);

          phases = [
            {
              phaseName: 'Fase 1: Pranayama y Centramiento (Ujjayi)',
              description: 'Instalación de la respiración oceánica Ujjayi Pranayama',
              poses: [{ poseId: 'tadasana', duration: '5 min centramiento con Ujjayi' }]
            },
            {
              phaseName: 'Fase 2: Calentamiento Dinámico - Saludos al Sol A y B',
              description: 'Surya Namaskar A y B sincronizando respiración y movimiento',
              poses: [
                { poseId: 'marjaryasana_bitilasana', duration: '5 respiraciones dinámicas' },
                { poseId: 'adho_mukha_svanasana', duration: '5 respiraciones' },
                { poseId: 'chaturanga_dandasana', duration: '3 vueltas Saludos al Sol A y B' },
                { poseId: 'bhujangasana', duration: '5 respiraciones' }
              ]
            },
            {
              phaseName: 'Fase 3: Rutina Formal - Flujo Dinámico Vinyasa',
              description: 'Secuencia encadenada continua y transiciones de Vinyasa',
              poses: pickedMain.map(p =>
                this.buildSequenceItem(p, this.isBilateralPose(p) ? '5 respiraciones por lado' : '5 respiraciones')
              )
            },
            {
              phaseName: 'Fase 4: Enfriamiento y Relajación Final (Savasana)',
              description: 'Desaceleración metabólica progresiva y reposo reparador',
              poses: [
                { poseId: 'balasana', duration: '2 min enfriamiento' },
                { poseId: 'savasana', duration: '8 min relajación final' }
              ]
            }
          ];
        } else {
          styleTitle = 'Hatha Yoga';
          focusText = 'Alineación Estática, Equilibrio y Fuerza Base';
          descriptionText = 'Rutina clásica de Hatha Yoga con Pranayama, Saludo al Sol tradicional y asanas sostenidas estáticamente.';

          const hathaBreaths = breathRoutines.filter(b =>
            ['nadi_shodhana', 'samavritti', 'kapalabhati', 'respiracion_completa', 'bhramari'].includes(b.id)
          );
          selectedBreath = hathaBreaths[Math.floor(Math.random() * hathaBreaths.length)] || breathRoutines[0];

          const warmupIds = ['marjaryasana_bitilasana', 'bhujangasana', 'adho_mukha_svanasana'];
          const excludedIds = new Set([...warmupIds, 'tadasana', 'savasana']);
          const hathaPool = allPoses.filter(p =>
            !excludedIds.has(p.id) && p.yogaType.toLowerCase().includes('hatha')
          );
          const pickedMain = this.pickRandomPoses(hathaPool, 5);

          phases = [
            {
              phaseName: 'Fase 1: Pranayama y Centramiento',
              description: 'Respiración consciente y alineación inicial',
              poses: [{ poseId: 'tadasana', duration: '5 min centramiento' }]
            },
            {
              phaseName: 'Fase 2: Calentamiento Articular y Saludos al Sol',
              description: 'Movilidad Gato-Vaca y Surya Namaskar clásico pausado',
              poses: [
                { poseId: 'marjaryasana_bitilasana', duration: '2 min movilidad articular' },
                { poseId: 'bhujangasana', duration: '5 respiraciones (Cobra en Saludo al Sol)' },
                { poseId: 'adho_mukha_svanasana', duration: '5 respiraciones (Perro Boca Abajo)' }
              ]
            },
            {
              phaseName: 'Fase 3: Rutina Formal - Asanas Estáticas Sostenidas',
              description: 'Posturas sostenidas estáticamente entre 45s y 2 min',
              poses: pickedMain.map(p =>
                this.buildSequenceItem(p, this.isBilateralPose(p) ? '1 min por lado' : '1 min')
              )
            },
            {
              phaseName: 'Fase 4: Relajación Final (Savasana)',
              description: 'Integración neuromuscular y calma parasimpática',
              poses: [{ poseId: 'savasana', duration: '10 min relajación final' }]
            }
          ];
        }

        const customRoutine: Routine = {
          id: 'custom_random_' + Date.now(),
          title: 'Rutina Aleatoria de ' + styleTitle,
          style: styleTitle,
          category: isYin ? 'Relaxation' : 'Exercise',
          durationMinutes: 60,
          durationFormatted: '60 min',
          level: 'Todos los niveles',
          focus: focusText,
          description: descriptionText,
          breathRoutine: selectedBreath.id,
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
                const phaseLower = phase.phaseName.toLowerCase();
                const isPranayamaPhase = phaseLower.includes('pranayama') || phaseLower.includes('fase 1');
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
