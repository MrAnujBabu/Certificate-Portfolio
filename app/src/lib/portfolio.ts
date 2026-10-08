export type ProjectLink = { name: string; url: string };

export type Certificate = {
  id: string;
  courseName: string;
  platform: string;
  completionDate: string;
  image: string;
  description: string;
  overview?: string | undefined;
  experience?: string | undefined;
  skills: string[];
  duration?: string | undefined;
  status: string;
  projectLinks?: ProjectLink[] | undefined;
};

export const REPO_OWNER = "MrAnujBabu";
export const REPO_NAME = "Certificate-Portfolio";
export const REPO_BRANCH = "main";

export function fileUrl(path: string) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${path.replace(/^\//, "")}`;
}

export function isPdf(path: string) {
  return /\.pdf($|\?)/i.test(path);
}
