export interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  coverImageUrl: string;
  category: string;
  photos: GalleryPhoto[];
}
