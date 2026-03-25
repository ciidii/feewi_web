export interface UploadTicketRequest {
  fileName: string;
  contentType: string;
  serviceOrigin: 'enrollment' | 'identity' | 'academic';
}

export interface UploadTicketResponse {
  fileId: string;
  uploadUrl: string;
}

export interface DocumentViewResponse {
  viewUrl: string;
}
