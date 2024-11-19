import {
  Component,
  inject,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TableColumn, TableComponent } from 'ngx-dabd-grupo01';
import { CommonModule } from '@angular/common';
import {
  UserDataService,
  UserData,
} from '../../../shared/services/user-data.service';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [TableComponent, CommonModule],
  templateUrl: './notes-list.component.html',
  styleUrl: './notes-list.component.scss',
})
export class NotesListComponent implements OnInit {
  // Inputs:
  @Input() notes: any[] = [];

  // Services:
  private modalService = inject(NgbModal);

  // Properties:
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('date') dateTemplate!: TemplateRef<any>;

  columns: TableColumn[] = [];

  userDataService = inject(UserDataService);
  userData!: UserData;

  loadUserData() {
    this.userDataService.loadNecessaryData().subscribe((response) => {
      if (response) {
        this.userData = response;
      }
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  // Methods:
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.columns = [
        { headerName: 'Usuario', accessorKey: 'created_by' },
        { headerName: 'Fecha', accessorKey: 'created_date' },
        { headerName: 'Nota', accessorKey: 'description' },
      ];
    });
  }

  openFormModal(itemId: number | null = null): void {
    // const modalRef = this.modalService.open(ConstructionNotesFormComponent);
    // modalRef.componentInstance.itemId = itemId;
  }
}
