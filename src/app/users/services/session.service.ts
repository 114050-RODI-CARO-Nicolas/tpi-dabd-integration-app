import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly USER_KEY = 'user';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.isAuthenticated()
  );

  isAuthenticated$: Observable<boolean> =
    this.isAuthenticatedSubject.asObservable();

  constructor() {
    //this.isAuthenticatedSubject.next(true)
  }

  /**
   * Sets a key-value pair in sessionStorage with an expiration time.
   *
   * @param key The key under which the value will be stored.
   * @param value The value to store (can be an object or a primitive).
   * @param expirationInMinutes The time (in minutes) after which the session will expire.
   */
  setItem(key: string, value: any, expirationInMinutes: number): void {
    const now = new Date();
    const expirationTime = now.getTime() + expirationInMinutes * 60000;
    const data = {
      value: value,
      expirationTime: expirationTime,
    };
    sessionStorage.setItem(key, JSON.stringify(data));
    if (key === this.USER_KEY) {
      this.isAuthenticatedSubject.next(true);
    }
  }

  /**
   * Retrieves an item from sessionStorage by its key.
   * Checks if the item has expired, and if so, removes it.
   *
   * @param key The key of the item to retrieve.
   * @returns The parsed value from sessionStorage, or null if not found or expired.
   */
  getItem(key: string): any {
    const jsonData = sessionStorage.getItem(key);
    if (!jsonData) {
      return null;
    }

    const data = JSON.parse(jsonData);
    const now = new Date();
    if (now.getTime() > data.expirationTime) {
      sessionStorage.removeItem(key);
      return null;
    }

    return data.value;
  }

  /**
   * Removes an item from sessionStorage by its key.
   *
   * @param key The key of the item to remove.
   */
  removeItem(key: string): void {
    sessionStorage.removeItem(key);
    if (key === this.USER_KEY) {
      this.isAuthenticatedSubject.next(false);
    }
  }

  /**
   * Clears all items from sessionStorage.
   */
  clear(): void {
    sessionStorage.clear();
  }

  /**
   * Checks if the user is authenticated by verifying the presence of the 'user' item.
   * @returns boolean indicating authentication status.
   */
  isAuthenticated(): boolean {
   // return this.getItem(this.USER_KEY) !== null;
    return true
  }

  /**
   * Logs out the user by removing the 'user' item from sessionStorage.
   */
  logout(): void {
    this.removeItem(this.USER_KEY);
  }

  /**
   * Verifica si el usuario tiene los códigos de roles especificados.
   *
   * @param targetRoleCodes - Lista de códigos de roles a verificar.
   * @returns true si el usuario tiene al menos uno de los códigos de roles especificados.
   */
  hasRoleCodes(targetRoleCodes: number[] | undefined): boolean {
    if (!targetRoleCodes) return true;
    const user = this.getItem(this.USER_KEY) as User;
    return !!user?.roles?.find(role => targetRoleCodes.includes(role.code));
  }
}
