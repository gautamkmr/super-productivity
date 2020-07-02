import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {MetricCopy} from '../metric.model';
import {MetricService} from '../metric.service';
import {ObstructionService} from '../obstruction/obstruction.service';
import {ImprovementService} from '../improvement/improvement.service';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {NoteService} from '../../note/note.service';
import {getWorklogStr} from '../../../util/get-work-log-str';
import {switchMap} from 'rxjs/operators';
import {ProjectService} from '../../project/project.service';
import {T} from '../../../t.const';
import {DialogAddNoteComponent} from '../../note/dialog-add-note/dialog-add-note.component';
import {MatDialog} from '@angular/material/dialog';


@Component({
  selector: 'evaluation-sheet',
  templateUrl: './evaluation-sheet.component.html',
  styleUrls: ['./evaluation-sheet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaluationSheetComponent implements OnDestroy, OnInit {
  @Output() save: EventEmitter<any> = new EventEmitter();
  T: any = T;
  metricForDay: MetricCopy;
  day$: BehaviorSubject<string> = new BehaviorSubject(getWorklogStr());
  private _metricForDay$: Observable<MetricCopy> = this.day$.pipe(
    switchMap((day) => this._metricService.getMetricForDayOrDefaultWithCheckedImprovements$(day)),
  );
  // isForToday$: Observable<boolean> = this.day$.pipe(map(day => day === getWorklogStr()));
  private _subs: Subscription = new Subscription();

  constructor(
    public obstructionService: ObstructionService,
    public improvementService: ImprovementService,
    private _metricService: MetricService,
    private _projectService: ProjectService,
    private _matDialog: MatDialog,
    private _noteService: NoteService,
    private _cd: ChangeDetectorRef,
  ) {
  }

  @Input() set day(val: string) {
    this.day$.next(val);
  }

  ngOnInit(): void {
    this._subs.add(this._metricForDay$.subscribe(metric => {
      this.metricForDay = metric;
      this._cd.detectChanges();
    }));
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  updateMood(mood: number) {
    this._update({mood});
  }

  updateProductivity(productivity: number) {
    this._update({productivity});
  }

  addObstruction(v: string) {
    this._update({obstructions: [...this.metricForDay.obstructions, v]});
  }

  addNewObstruction(v: string) {
    const id = this.obstructionService.addObstruction(v);
    this._update({obstructions: [...this.metricForDay.obstructions, id]});
  }

  removeObstruction(idToRemove: string) {
    this._update({obstructions: this.metricForDay.obstructions.filter(id => id !== idToRemove)});
  }

  addImprovement(v: string) {
    this._update({improvements: [...this.metricForDay.improvements, v]});
  }

  addNewImprovement(v: string) {
    const id = this.improvementService.addImprovement(v);
    this._update({improvements: [...this.metricForDay.improvements, id]});
  }

  removeImprovement(idToRemove: string) {
    this._update({improvements: this.metricForDay.improvements.filter(id => id !== idToRemove)});
  }

  addImprovementTomorrow(v: string) {
    this._update({improvementsTomorrow: [...this.metricForDay.improvementsTomorrow, v]});
  }

  addNewImprovementTomorrow(v: string) {
    const id = this.improvementService.addImprovement(v);
    this._update({improvementsTomorrow: [...this.metricForDay.improvementsTomorrow, id]});
  }

  removeImprovementTomorrow(idToRemove: string) {
    this._update({
      improvementsTomorrow: this.metricForDay.improvementsTomorrow.filter(id => id !== idToRemove),
    });
    // this.improvementService.disableImprovementRepeat(idToRemove);
  }

  toggleImprovementRepeat(improvementId: string) {
    this.improvementService.toggleImprovementRepeat(improvementId);
  }

  addNote() {
    this._matDialog.open(DialogAddNoteComponent);
  }

  private _update(updateData: Partial<MetricCopy>) {
    this.metricForDay = {
      ...this.metricForDay,
      ...updateData,
    } as MetricCopy;
    this._metricService.upsertMetric(this.metricForDay);
  }
}
