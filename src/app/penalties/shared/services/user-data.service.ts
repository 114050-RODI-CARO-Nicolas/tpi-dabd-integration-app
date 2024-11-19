import { inject, Injectable } from '@angular/core';
import { SessionService } from '../../../users/services/session.service';
import { ToastService } from 'ngx-dabd-grupo01';
import { Observable, map, catchError, of, switchMap } from 'rxjs';
import { User } from '../../../users/models/user';
import { OwnerPlotService } from '../../../users/services/owner-plot.service';
import { UserService } from '../../../users/services/user.service';
import { Role } from '../../../users/models/role';
import { Plot } from '../../../users/models/plot';
import { HttpHeaders } from '@angular/common/http';

export interface UserData {
  id: number;
  roles: Role[];
  plots: Plot[];
  plotIds: number[];
}

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private sessionService = inject(SessionService);
  private userService = inject(UserService);
  private ownerPlotService = inject(OwnerPlotService);
  private toastService = inject(ToastService);

  loadNecessaryData(): Observable<UserData | null> {
    const user: User = this.sessionService.getItem('user');
    const userId = user?.id || 1;

    return this.userService.getUserById(userId).pipe(
      switchMap((response) => {
        const ownerId = response.ownerId || 1;

        return this.ownerPlotService
          .giveAllPlotsByOwner(ownerId, 0, 100000)
          .pipe(
            map((plotResponse) => {
              const userData: UserData = {
                id: user.id || 1,
                roles: user.roles || [],
                plots: plotResponse.content || [],
                plotIds: (plotResponse.content || []).map((plot) => plot.id),
              };
              return userData;
            })
          );
      }),
      catchError((error) => {
        this.toastService.sendError(
          'Error al cargar los datos del usuario. Por favor, intente de nuevo.'
        );
        return of(null);
      })
    );
  }

  getHeaders(): HttpHeaders {
    const user: User = this.sessionService.getItem('user');
    const userId = user?.id || 1;

    return new HttpHeaders().set('x-user-id', userId.toString());
  }

  userHasRole(userData: UserData, role: string): boolean {
    return userData?.roles?.some((userRole) => userRole.name === role || userRole.name === 'SUPERADMIN');
  }
}
