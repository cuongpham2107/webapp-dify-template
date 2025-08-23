export type TypeWithI18N<T = string> = {
  'en_US': T
  'zh_Hans': T
  [key: string]: T
}


export interface Dataset {
  id: string;
  dataset_id: string;
  name: string;
  parent_id: string | null;
  parent: Dataset | null;
  children: Dataset[];
  documents: Document[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  document_id: string;
  name: string;
  type: string;
  size: number;
  datasetId: string;
  dataset: Dataset | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}
