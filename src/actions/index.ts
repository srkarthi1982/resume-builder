import {
  addOrUpdateItem,
  createResumeProject,
  deleteItem,
  deleteResumeProject,
  getResumeProject,
  listResumeProjects,
  resumeUpdateProjectPhoto,
  setDefaultResumeProject,
  updateResumeProject,
  upsertSection,
} from "./resumeBuilder";
import { listResumeBookmarks, toggleBookmark } from "./bookmarks";

export const resumeBuilder = {
  listResumeProjects,
  createResumeProject,
  getResumeProject,
  updateResumeProject,
  resumeUpdateProjectPhoto,
  deleteResumeProject,
  setDefaultResumeProject,
  upsertSection,
  addOrUpdateItem,
  deleteItem,
  listResumeBookmarks,
  toggleBookmark,
};

export const server = {
  resumeBuilder,
};
