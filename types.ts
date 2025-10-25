export type CheckStatus = 'unchecked' | 'good' | 'not-good';

export interface ChecklistItemData {
  id: string;
  label: string;
  photo: string | null;
  status: CheckStatus;
  notes: string;
  isAnalyzing?: boolean;
}
