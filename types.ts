export type CheckStatus = 'unchecked' | 'good' | 'not-good';

export interface ChecklistItemData {
  id: string;
  label: string;
  photo: string | null;
  status: CheckStatus;
  notes: string;
  isAnalyzing?: boolean;
}

export interface SavedInspection {
  id: string;
  date: string;
  carIdentity: {
    licensePlate: string;
    odometer: string;
  };
  items: ChecklistItemData[];
}
