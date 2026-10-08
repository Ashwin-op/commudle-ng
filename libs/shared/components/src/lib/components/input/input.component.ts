import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'commudle-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  standalone: false,
})
export class InputComponent {
  @Input() placeholder = 'Enter text';
  @Input() type: 'text' | 'number' | 'datetime-local' | 'time' | 'date' = 'text';
  @Input() id: string;
  @Input() name: string;
  @Input() min: string | number;
  @Input() inputValue: string | number = '';
  @Output() valueChange = new EventEmitter<string | number>();
  @Output() blurEvent = new EventEmitter<void>(); // Added for blur event

  onInputChange(event: any) {
    if (this.type === 'number') {
      this.inputValue = event.target.value ? Number(event.target.value) : '';
    } else {
      this.inputValue = event.target.value;
    }
    this.valueChange.emit(this.inputValue);
  }

  onBlur() {
    this.blurEvent.emit(); // Emit blur event
  }
}
