import {
  addOrUpdateItem,
  createResumeProject,
  deleteItem,
  deleteResumeProject,
  getResumeProject,
  listResumeProjects,
  setDefaultResumeProject,
  updateResumeProject,
  upsertSection,
} from "./resumeBuilder";

export const resumeBuilder = {
  listResumeProjects,
  createResumeProject,
  getResumeProject,
  updateResumeProject,
  deleteResumeProject,
  setDefaultResumeProject,
  upsertSection,
  addOrUpdateItem,
  deleteItem,
};

export const server = {
  resumeBuilder,
};
