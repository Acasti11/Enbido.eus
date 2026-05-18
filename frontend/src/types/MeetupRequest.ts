export interface MeetupRequest {
  requestId: number;
  adId: number;
  applicantId: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
}