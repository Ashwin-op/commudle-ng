import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NbCheckboxModule, NbDialogService, NbInputModule } from '@commudle/theme';
import { CommudleButtonModule } from '@commudle/commudle-theme';
import { ICertificateBatch, ICertificateVariable, ICertificateVariableTextStyle } from '@commudle/shared-models';
import { CertificateVariableService } from '@commudle/shared-services';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { faEllipsisVertical, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { Subject, takeUntil } from 'rxjs';
import type KonvaNamespace from 'konva';
import { CertificateVariableDefaultValueDialogComponent } from '../certificate-variable-default-value-dialog/certificate-variable-default-value-dialog.component';
import { openCertificateConfirmDialog } from '../certificate-confirm-dialog/certificate-confirm-dialog.component';

type VariableAction = 'default_value' | 'delete';

const DEFAULT_TEXT_STYLE: ICertificateVariableTextStyle = {
  font: 'Helvetica',
  size: 16,
  color: '000000',
  weight: 'normal',
  style: 'normal',
  align: 'left',
};

const DEFAULT_BOX_WIDTH = 0.25;
const DEFAULT_BOX_HEIGHT = 0.08;
const MAX_CANVAS_WIDTH = 800;

// `text_style.size` is sent to the backend as a literal Prawn point size,
// and the PDF page is always exactly the design image's native pixel
// dimensions (1 image pixel = 1 PDF point, no server-side scaling) - so a
// flat default here would look wildly different across a 400px-tall vs a
// 4000px-tall design. Deriving it from this design's own image_height
// keeps a newly placed variable's text proportionate to its box
// regardless of the uploaded image's resolution.
const DEFAULT_FONT_SIZE_RATIO = 0.035;
const MIN_DEFAULT_FONT_SIZE = 12;
const MAX_DEFAULT_FONT_SIZE = 200;

// Limited to whatever Certificates::PdfRenderer (gdgapp) can actually
// render - the 3 Prawn built-ins plus 5 bundled TTF families registered via
// font_families.update() (AVAILABLE_FONTS in pdf_renderer.rb, 2026-09-22).
// Broad-Unicode/non-Latin fallback is still a separate, unaddressed open
// item (see spec's Open Design Decisions). Names must match AVAILABLE_FONTS
// exactly - Prawn resolves purely by this string.
export const CERTIFICATE_FONT_OPTIONS = [
  'Helvetica',
  'Times-Roman',
  'Courier',
  'Playfair Display',
  'Open Sans',
  'Great Vibes',
  'JetBrains Mono',
  'Cinzel',
];

@Component({
  selector: 'commudle-certificate-canvas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CommudleButtonModule,
    NbInputModule,
    NbCheckboxModule,
    FontAwesomeModule,
    SharedComponentsModule,
  ],
  templateUrl: './certificate-canvas.component.html',
  styleUrls: ['./certificate-canvas.component.scss'],
})
export class CertificateCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() batch: ICertificateBatch;
  // certificate-batch-detail's onBatchUpdated() merges updates into the
  // shared `batch` object in place rather than reassigning it (so picking a
  // design doesn't flash the recipients table) - which means `batch` itself
  // never changes reference, so ngOnChanges below can't detect a new design
  // from that input alone. This is bound separately, straight off
  // `batch.design?.id`, purely so its primitive value change (compared by
  // value, not reference) gives ngOnChanges something to actually fire on.
  @Input() designId: number | null = null;
  @Output() variablesChanged = new EventEmitter<void>();

  @ViewChild('stageContainer', { static: false }) stageContainer: ElementRef<HTMLDivElement>;

  variables: ICertificateVariable[] = [];
  selectedVariable: ICertificateVariable | null = null;
  isLoading = true;
  isSaving = false;
  isDirty = false;
  fontOptions = CERTIFICATE_FONT_OPTIONS;

  showAddForm = false;
  addForm: FormGroup;
  icons = { faPlus, faEllipsisVertical };

  private Konva: typeof KonvaNamespace;
  private stage: KonvaNamespace.Stage;
  private layer: KonvaNamespace.Layer;
  private transformer: KonvaNamespace.Transformer;
  private boxesById = new Map<
    number,
    { group: KonvaNamespace.Group; rect: KonvaNamespace.Rect; text: KonvaNamespace.Text }
  >();
  private scale = 1;
  private viewInitialized = false;
  private destroy$ = new Subject<void>();
  // `batch` is shared across every sibling tab (design picker, recipients
  // table, this canvas) via a single [batch]="batch" binding at the parent.
  // Refetching on every update to it (or every designId change) would
  // silently discard an in-progress, not-yet-saved style/position edit
  // (isDirty local state) the moment an unrelated tab action fires. Only
  // refetch when the batch or its chosen design has actually changed.
  private loadedBatchUuid: string;
  private loadedDesignId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private certificateVariableService: CertificateVariableService,
    private toastLogService: LibToastLogService,
    private dialogService: NbDialogService,
  ) {
    this.addForm = this.fb.group({
      label: ['', Validators.required],
    });
  }

  ngAfterViewInit() {
    this.viewInitialized = true;
    if (this.batch?.design) {
      this.initCanvas();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((!changes.batch && !changes.designId) || !this.batch) {
      return;
    }
    const designId = this.batch.design?.id ?? null;
    if (this.batch.uuid !== this.loadedBatchUuid) {
      this.loadedDesignId = designId;
      this.fetchVariables();
      return;
    }
    // Same batch, but a new design was chosen elsewhere - the canvas needs
    // rebuilding against the new background/dimensions, but the variables
    // themselves haven't changed server-side, so there's no need to (and
    // shouldn't) refetch/discard any in-progress local edit for this.
    if (designId !== this.loadedDesignId) {
      this.loadedDesignId = designId;
      if (this.viewInitialized && this.batch.design) {
        this.initCanvas();
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stage?.destroy();
  }

  fetchVariables() {
    this.isLoading = true;
    this.loadedBatchUuid = this.batch.uuid;
    this.certificateVariableService
      .indexCertificateVariables(this.batch.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.variables = res.certificate_variables;
        this.isLoading = false;
        if (this.viewInitialized && this.batch?.design) {
          this.initCanvas();
        }
      });
  }

  // Refreshes the variable list only - unlike fetchVariables(), doesn't
  // re-run initCanvas() (which destroys and rebuilds the whole Konva
  // stage). Used when another section (CSV upload, add/delete variable)
  // changes the variable set we don't already have rendered, so there's
  // nothing on the canvas itself to redraw.
  //
  // Merges rather than replaces wholesale: toggling a variable's canvas
  // placement (addToCanvas()/removeFromCanvas()/onBoxTransformed()) only
  // mutates `positioned`/`positions`/`text_style` locally and sets
  // isDirty - nothing is saved until saveLayout() runs. A plain
  // `this.variables = res.certificate_variables` here would silently
  // overwrite any such unsaved toggle with the server's last-saved value
  // the moment a variable was added/deleted elsewhere, discarding the
  // organizer's pending edit without any indication it happened. While
  // isDirty is true, this keeps the locally-held placement fields for
  // every variable that still exists server-side, and only lets the
  // server's data through for genuinely new/removed variables.
  refreshVariablesList() {
    this.certificateVariableService
      .indexCertificateVariables(this.batch.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!this.isDirty) {
          this.variables = res.certificate_variables;
          return;
        }
        const existingById = new Map(this.variables.map((variable) => [variable.id, variable]));
        this.variables = res.certificate_variables.map((fresh) => {
          const existing = existingById.get(fresh.id);
          return existing
            ? {
                ...fresh,
                positioned: existing.positioned,
                positions: existing.positions,
                text_style: existing.text_style,
              }
            : fresh;
        });
      });
  }

  private async initCanvas() {
    if (!this.Konva) {
      const mod = await import('konva');
      this.Konva = mod.default;
    }
    // Konva draws text onto a <canvas>, not the DOM - it gets none of the
    // browser's automatic FOUT/FOIT redraw-on-font-ready behavior. If a
    // webfont (see index.html) hasn't actually finished loading yet, a
    // Text node drawn now is stuck on the fallback font until something
    // manually redraws it later, which nothing here otherwise does.
    await this.ensureFontsLoaded();
    this.stage?.destroy();
    this.boxesById.clear();

    const { image_width, image_height, background_image_url } = this.batch.design;
    this.scale = Math.min(1, MAX_CANVAS_WIDTH / image_width);
    const displayWidth = image_width * this.scale;
    const displayHeight = image_height * this.scale;

    this.stage = new this.Konva.Stage({
      container: this.stageContainer.nativeElement,
      width: displayWidth,
      height: displayHeight,
    });
    this.layer = new this.Konva.Layer();
    this.stage.add(this.layer);

    const imageEl = new Image();
    imageEl.crossOrigin = 'anonymous';
    imageEl.onload = () => {
      const bgImage = new this.Konva.Image({
        image: imageEl,
        width: displayWidth,
        height: displayHeight,
        listening: false,
      });
      this.layer.add(bgImage);
      bgImage.moveToBottom();
      this.layer.draw();
    };
    imageEl.src = background_image_url;

    this.transformer = new this.Konva.Transformer({
      rotateEnabled: false,
      enabledAnchors: [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'top-center',
        'bottom-center',
        'middle-left',
        'middle-right',
      ],
    });
    this.layer.add(this.transformer);

    this.stage.on('click tap', (e) => {
      if (e.target === this.stage) {
        this.deselect();
      }
    });

    this.variables.filter((v) => v.positioned).forEach((variable) => this.renderBox(variable));

    this.layer.draw();
  }

  // document.fonts.load() explicitly requests each family used by a
  // positioned variable's text_style and waits for it - CSS-only
  // (index.html's <link>) declares the @font-face but doesn't force the
  // browser to actually fetch the file until something on the page renders
  // with it, which a <canvas> draw doesn't count as. Best-effort: a font
  // that fails to load just falls back to the browser default in this
  // preview only - the real PDF render on gdgapp is unaffected either way.
  private async ensureFontsLoaded() {
    if (typeof document === 'undefined' || !('fonts' in document)) {
      return;
    }
    const families = new Set(
      this.variables.filter((v) => v.positioned).map((v) => (v.text_style || DEFAULT_TEXT_STYLE).font),
    );
    try {
      await Promise.all(Array.from(families).map((family) => document.fonts.load(`16px "${family}"`)));
    } catch {
      // best-effort, see comment above
    }
  }

  private renderBox(variable: ICertificateVariable) {
    const displayWidth = this.batch.design.image_width * this.scale;
    const displayHeight = this.batch.design.image_height * this.scale;
    const pos = variable.positions;
    const style = variable.text_style || DEFAULT_TEXT_STYLE;

    const group = new this.Konva.Group({
      x: pos.x * displayWidth,
      y: pos.y * displayHeight,
      draggable: true,
    });

    const rect = new this.Konva.Rect({
      width: pos.width * displayWidth,
      height: pos.height * displayHeight,
      stroke: '#3366ff',
      strokeWidth: 1,
      dash: [4, 4],
      fill: 'rgba(51, 102, 255, 0.08)',
    });

    const text = new this.Konva.Text({
      width: pos.width * displayWidth,
      height: pos.height * displayHeight,
      text: `{{${variable.label}}}`,
      verticalAlign: 'middle',
      padding: 2,
    });
    this.applyStyleToText(text, style);

    group.add(rect);
    group.add(text);
    this.layer.add(group);

    group.on('click tap', (e) => {
      e.cancelBubble = true;
      this.select(variable, group);
    });

    // Dragging doesn't fire a 'click' when the drag threshold is exceeded,
    // so selecting only on click leaves a dragged box unselected - select
    // as soon as the drag starts instead.
    group.on('dragstart', () => this.select(variable, group));

    group.on('dragend', () => this.onBoxTransformed(variable, group, rect));
    group.on('transformend', () => this.onBoxTransformed(variable, group, rect));

    this.boxesById.set(variable.id, { group, rect, text });
  }

  private applyStyleToText(text: KonvaNamespace.Text, style: ICertificateVariableTextStyle) {
    text.fontSize((style.size || 16) * this.scale);
    text.fontFamily(style.font || 'Helvetica');
    text.fontStyle(
      `${style.weight === 'bold' ? 'bold' : ''} ${style.style === 'italic' ? 'italic' : ''}`.trim() || 'normal',
    );
    text.fill(style.color ? `#${style.color}` : '#000000');
    text.align(style.align || 'left');
  }

  private onBoxTransformed(variable: ICertificateVariable, group: KonvaNamespace.Group, rect: KonvaNamespace.Rect) {
    const displayWidth = this.batch.design.image_width * this.scale;
    const displayHeight = this.batch.design.image_height * this.scale;

    const scaleX = group.scaleX();
    const scaleY = group.scaleY();
    const width = rect.width() * scaleX;
    const height = rect.height() * scaleY;
    group.scaleX(1);
    group.scaleY(1);
    rect.width(width);
    rect.height(height);
    const box = this.boxesById.get(variable.id);
    box.text.width(width);
    box.text.height(height);

    variable.positions = {
      x: group.x() / displayWidth,
      y: group.y() / displayHeight,
      width: width / displayWidth,
      height: height / displayHeight,
    };
    variable.positioned = true;
    this.isDirty = true;
    this.layer.draw();
  }

  private select(variable: ICertificateVariable, group: KonvaNamespace.Group) {
    this.selectedVariable = variable;
    this.transformer.nodes([group]);
    this.layer.draw();
  }

  deselect() {
    this.selectedVariable = null;
    this.transformer?.nodes([]);
    this.layer?.draw();
  }

  addToCanvas(variable: ICertificateVariable) {
    const displayWidth = this.batch.design.image_width * this.scale;
    const displayHeight = this.batch.design.image_height * this.scale;
    variable.positions = {
      x: (displayWidth / 2 - (DEFAULT_BOX_WIDTH * displayWidth) / 2) / displayWidth,
      y: (displayHeight / 2 - (DEFAULT_BOX_HEIGHT * displayHeight) / 2) / displayHeight,
      width: DEFAULT_BOX_WIDTH,
      height: DEFAULT_BOX_HEIGHT,
    };
    variable.text_style = variable.text_style || {
      ...DEFAULT_TEXT_STYLE,
      size: this.defaultFontSize(),
    };
    variable.positioned = true;
    this.renderBox(variable);
    this.isDirty = true;
    this.layer.draw();
  }

  private defaultFontSize(): number {
    const size = Math.round(this.batch.design.image_height * DEFAULT_FONT_SIZE_RATIO);
    return Math.min(MAX_DEFAULT_FONT_SIZE, Math.max(MIN_DEFAULT_FONT_SIZE, size));
  }

  removeFromCanvas(variable: ICertificateVariable) {
    this.destroyBox(variable.id);
    variable.positions = null;
    variable.positioned = false;
    if (this.selectedVariable?.id === variable.id) {
      this.deselect();
    }
    this.isDirty = true;
    this.layer.draw();
  }

  toggleCanvasPlacement(variable: ICertificateVariable, placed: boolean) {
    if (placed) {
      this.addToCanvas(variable);
    } else {
      this.removeFromCanvas(variable);
    }
  }

  private destroyBox(variableId: number) {
    const box = this.boxesById.get(variableId);
    box?.group.destroy();
    this.boxesById.delete(variableId);
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.addForm.reset();
    }
  }

  addVariable() {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    this.certificateVariableService
      .createCertificateVariable(this.batch.uuid, this.addForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (variable) => {
          this.variables = [...this.variables, variable];
          this.addForm.reset();
          this.showAddForm = false;
          this.variablesChanged.emit();
        },
        error: () => {
          this.toastLogService.errorDialog('Could not add the variable');
        },
      });
  }

  onVariableAction(variable: ICertificateVariable, action: VariableAction | '') {
    if (action === 'default_value') {
      this.setDefaultValue(variable);
    } else if (action === 'delete') {
      this.deleteVariable(variable);
    }
  }

  setDefaultValue(variable: ICertificateVariable) {
    this.dialogService
      .open(CertificateVariableDefaultValueDialogComponent, {
        context: { label: variable.label, defaultValue: variable.default_value || '' },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((value: string | undefined) => {
        if (value === undefined || value === variable.default_value) {
          return;
        }
        this.certificateVariableService
          .updateCertificateVariable(this.batch.uuid, variable.id, { default_value: value })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updated) => {
              variable.default_value = updated.default_value;
              variable.default_set = updated.default_set;
            },
            error: () => {
              this.toastLogService.errorDialog('Could not update the default value');
            },
          });
      });
  }

  deleteVariable(variable: ICertificateVariable) {
    openCertificateConfirmDialog(this.dialogService, {
      message: `Remove the "${variable.label}" variable? This cannot be undone.`,
      danger: true,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.certificateVariableService
          .deleteCertificateVariable(this.batch.uuid, variable.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              if (variable.positioned) {
                this.destroyBox(variable.id);
                if (this.selectedVariable?.id === variable.id) {
                  this.deselect();
                }
                this.layer.draw();
              }
              this.variables = this.variables.filter((v) => v.id !== variable.id);
              this.toastLogService.successDialog('Variable removed');
              this.variablesChanged.emit();
            },
            error: () => {
              this.toastLogService.errorDialog('Could not remove the variable');
            },
          });
      });
  }

  updateStyle(patch: Partial<ICertificateVariableTextStyle>) {
    if (!this.selectedVariable) {
      return;
    }
    this.selectedVariable.text_style = { ...(this.selectedVariable.text_style || DEFAULT_TEXT_STYLE), ...patch };
    const box = this.boxesById.get(this.selectedVariable.id);
    if (box) {
      this.applyStyleToText(box.text, this.selectedVariable.text_style);
      this.layer.draw();
    }
    this.isDirty = true;
  }

  // Sends every variable's current state, not just the positioned ones -
  // update_layout on the backend only touches ids present in the payload,
  // so a variable just removed from the canvas (positions set to null
  // locally) must still be included here, or its old position is never
  // cleared server-side and it keeps rendering on the actual PDF.
  saveLayout() {
    this.isSaving = true;
    this.certificateVariableService
      .updateLayout(
        this.batch.uuid,
        this.variables.map((v) => ({ id: v.id, positions: v.positions, text_style: v.text_style })),
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Deliberately not swapping `this.variables` for the response
          // body here - the server echoes back exactly what was just sent
          // (no transformation happens server-side), and replacing it with
          // freshly-deserialized objects would orphan `selectedVariable`
          // and every Konva box's click handler (both still reference the
          // pre-save objects), silently breaking every toggle made after
          // the first successful save - it would keep mutating the
          // orphaned object while every future save re-sent this stale
          // snapshot forever.
          this.isSaving = false;
          this.isDirty = false;
          this.toastLogService.successDialog('Layout saved');
        },
        error: () => {
          this.isSaving = false;
          this.toastLogService.errorDialog('Could not save the layout');
        },
      });
  }
}
