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

export type DocumentType = 'CERTIFICAT_SCOLARITE' | 'RELEVE_NOTES' | 'ATTESTATION_PAIEMENT';

export type DocumentRequestStatus = 'PENDING' | 'ELIGIBLE' | 'INELIGIBLE' | 'READY' | 'REJECTED' | 'DELIVERED';

export interface DocumentRequest {
  id: string;
  studentId: string;
  documentType: DocumentType;
  requestedBy: string;
  status: DocumentRequestStatus;
  rejectionReason?: string;
  /** Référence au PDF généré (StoredFile.id), renseigné automatiquement à l'approbation */
  fileId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SubmitDocumentRequest {
  studentId: string;
  documentType: DocumentType;
  requestedBy: string;
}
