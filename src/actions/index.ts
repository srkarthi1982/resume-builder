import {
  adminCreateItem,
  adminDeleteItem,
  adminListItems,
  adminUpdateItem,
  createItem,
  deleteMyItem,
  fetchMyItems,
  updateMyItem,
} from "./exampleItems";

export const exampleItems = {
  fetchMyItems,
  createItem,
  updateMyItem,
  deleteMyItem,
  adminListItems,
  adminCreateItem,
  adminUpdateItem,
  adminDeleteItem,
};

export const server = {
  exampleItems,
  admin: {
    listExampleItems: exampleItems.adminListItems,
    createExampleItem: exampleItems.adminCreateItem,
    updateExampleItem: exampleItems.adminUpdateItem,
    deleteExampleItem: exampleItems.adminDeleteItem,
  },
};
