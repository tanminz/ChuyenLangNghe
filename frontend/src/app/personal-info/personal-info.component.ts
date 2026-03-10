import { Component, OnInit } from '@angular/core';
import { UserAPIService } from '../user-api.service';
import { User } from '../../interface/User';
import { DateService } from '../services/date.service';

@Component({
  selector: 'app-personal-info',
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.css']
})
export class PersonalInfoComponent implements OnInit {
  personalInfo: Partial<User> = {
    birthDate: { day: '', month: '', year: '' }
  };
  originalInfo: Partial<User> = {
    birthDate: { day: '', month: '', year: '' }
  };
  isEditing = false;
  avatarPreview: string | null = null;

  months: string[] = [];
  days: number[] = [];
  years: number[] = [];

  constructor(
    private userAPIService: UserAPIService,
    private dateService: DateService
  ) { }

  private cloneUser(user: Partial<User>): Partial<User> {
    return {
      ...user,
      avatar: (user as any).avatar ?? '',
      birthDate: user?.birthDate ? { ...user.birthDate } : { day: '', month: '', year: '' }
    };
  }

  ngOnInit(): void {
    this.loadUserInfo();
    this.months = this.dateService.getMonths();
    this.days = this.dateService.getDays();
    this.years = this.dateService.getYears();
  }

  get points(): number {
    return (this.personalInfo.memberPoints as number) || 0;
  }

  get tierKey(): 'member' | 'silver' | 'gold' | 'platinum' {
    const p = this.points;
    if (p >= 1000) return 'platinum';
    if (p >= 500) return 'gold';
    if (p >= 100) return 'silver';
    return 'member';
  }

  get tierName(): string {
    switch (this.tierKey) {
      case 'silver': return 'Bạc';
      case 'gold': return 'Vàng';
      case 'platinum': return 'Platinum';
      default: return 'Member';
    }
  }

  get progressToNext(): number {
    const pct = this.points % 100;
    return pct;
  }

  get remainingToNext(): number {
    return 100 - (this.points % 100);
  }

  loadUserInfo(): void {
    this.userAPIService.getUserDetails().subscribe({
      next: (user) => {
        const hydratedUser = this.cloneUser({
          ...user,
          _id: user._id || '',
          memberPoints: user.memberPoints || 0,
          memberTier: user.memberTier || 'Member'
        });
        this.personalInfo = this.cloneUser(hydratedUser);
        this.originalInfo = this.cloneUser(hydratedUser);
        this.avatarPreview = (user as any).avatar || null;
      },
      error: (err) => {
        console.error('Error loading user info:', err);
      }
    });
  }

  editInfo(): void {
    this.isEditing = true;
    this.avatarPreview = (this.personalInfo as any).avatar || this.avatarPreview || null;
  }

  saveInfo(): void {
    const updateData: any = { ...this.personalInfo };
    delete updateData._id;
    delete updateData.email;
    if (this.avatarPreview !== undefined) {
      updateData.avatar = this.avatarPreview;
    }

    this.userAPIService.updateMyProfile(updateData).subscribe({
      next: (res) => {
        this.isEditing = false;
        if (res?.user) {
          const refreshed = this.cloneUser({
            ...res.user,
            _id: res.user._id || this.personalInfo._id || ''
          });
          this.personalInfo = this.cloneUser(refreshed);
          this.originalInfo = this.cloneUser(refreshed);
          this.avatarPreview = refreshed.avatar ? refreshed.avatar : null;
        } else {
          this.loadUserInfo();
        }
      },
      error: (err) => {
        console.error('Error updating user info:', err);
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.personalInfo = this.cloneUser(this.originalInfo);
    this.avatarPreview = (this.originalInfo as any).avatar || null;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result as string;
      (this.personalInfo as any).avatar = this.avatarPreview;
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.avatarPreview = null;
    (this.personalInfo as any).avatar = '';
  }
}
