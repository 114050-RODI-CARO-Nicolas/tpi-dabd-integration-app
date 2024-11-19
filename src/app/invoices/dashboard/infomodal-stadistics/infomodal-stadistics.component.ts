import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-infomodal-stadistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './infomodal-stadistics.component.html',
  styleUrl: './infomodal-stadistics.component.scss'
})
export class InfomodalStadisticsComponent {
  @Input() modalType: string = '';

  constructor(public activeModal: NgbActiveModal) {}
}
