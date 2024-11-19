import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import {
  ClassicEditor,
  Bold,
  Essentials,
  Italic,
  Paragraph,
  Undo,
  Heading,
  List,
  Indent,
} from 'ckeditor5';
import { MainContainerComponent } from 'ngx-dabd-grupo01';
import { UserDataService, UserData } from '../../shared/services/user-data.service';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [MainContainerComponent, CommonModule, FormsModule, CKEditorModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './rules.component.html',
  styleUrl: './rules.component.scss',
})
export class RulesComponent {
  public Editor = ClassicEditor;

  rulesContent: string = '';
  editMode: boolean = false;

  public config = {
    toolbar: [
      'undo',
      'redo',
      '|',
      'heading',
      '|',
      'bold',
      'italic',
      '|',
      'bulletedList',
      'numberedList',
    ],
    plugins: [Essentials, Bold, Italic, Undo, Paragraph, Heading, List, Indent],
    language: { ui: 'en' },
  };

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
    this.loadRules();
  }

  loadRules(): void {
    const savedRules = localStorage.getItem('rulesContent');
    this.rulesContent = savedRules || 'No hay reglas definidas.';
  }

  onChange({ editor }: any): void {
    this.rulesContent = editor.getData();
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
  }

  saveRules(): void {
    localStorage.setItem('rulesContent', this.rulesContent);
    this.editMode = false;
  }
}
