export type ExampleItemDTO = {
  id: string;
  userId: string;
  userName?: string | null;
  title: string;
  content: string | null;
  isArchived: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ExampleItemForm = {
  title: string;
  content: string;
  isArchived?: boolean;
};
