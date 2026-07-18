import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChevronLeft, ChevronRight, Images, LucideAngularModule} from 'lucide-angular';
import {finalize} from 'rxjs';
import {TenantContextService} from '../../../../core/services/tenant-context.service';
import {ShowcaseContentService} from '../../../../core/services/showcase-content.service';
import {GalleryAlbum} from '../../../../core/models/showcase';
import {FwEmptyStateComponent} from '../../../../shared/components/empty-state/empty-state.component';
import {BlockLoaderComponent} from '../../../../shared/components/loader/block-loader.component';
import {FwModalShellComponent} from '../../../../shared/components/modal-shell/modal-shell.component';

@Component({
  selector: 'app-showcase-gallery',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwEmptyStateComponent, BlockLoaderComponent, FwModalShellComponent],
  templateUrl: './showcase-gallery.component.html',
  styleUrls: ['./showcase-gallery.component.scss']
})
export class ShowcaseGalleryComponent implements OnInit {
  private showcaseService = inject(ShowcaseContentService);
  tenantCtx = inject(TenantContextService);

  isLoading = signal(true);
  albums = signal<GalleryAlbum[]>([]);
  activeCategory = signal<string>('Toutes');
  selectedAlbum = signal<GalleryAlbum | null>(null);
  selectedPhotoIndex = signal(0);

  categories = computed(() => ['Toutes', ...Array.from(new Set(this.albums().map(a => a.category)))]);

  filteredAlbums = computed(() => {
    const category = this.activeCategory();
    return category === 'Toutes' ? this.albums() : this.albums().filter(a => a.category === category);
  });

  selectedPhoto = computed(() => this.selectedAlbum()?.photos[this.selectedPhotoIndex()] ?? null);

  ngOnInit() {
    const tenantId = this.tenantCtx.activeTenant()!.id;
    this.showcaseService.getGalleryAlbums(tenantId).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(albums => this.albums.set(albums));
  }

  setCategory(category: string) {
    this.activeCategory.set(category);
  }

  openAlbum(album: GalleryAlbum) {
    this.selectedAlbum.set(album);
    this.selectedPhotoIndex.set(0);
  }

  closeAlbum() {
    this.selectedAlbum.set(null);
  }

  nextPhoto() {
    const album = this.selectedAlbum();
    if (!album) return;
    this.selectedPhotoIndex.set((this.selectedPhotoIndex() + 1) % album.photos.length);
  }

  prevPhoto() {
    const album = this.selectedAlbum();
    if (!album) return;
    this.selectedPhotoIndex.set((this.selectedPhotoIndex() - 1 + album.photos.length) % album.photos.length);
  }

  readonly Images = Images;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
}
