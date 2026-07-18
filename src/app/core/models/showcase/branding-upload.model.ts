export interface BrandingUploadTicketRequest {
  fileName: string;
  contentType: string;
  target: 'logo' | 'cover';
}

export interface BrandingUploadTicketResponse {
  fileId: string;
  uploadUrl: string;
  publicUrl: string;
}
