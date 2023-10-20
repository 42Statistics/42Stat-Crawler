export type GithubRepoInfo = {
  owner: string;
  repo: string;
};

export type GithubBranchInfo = GithubRepoInfo & { branch: string };

export type GithubRepoContentInfo = GithubRepoInfo & {
  path: string;
  ref?: string;
};

export type GithubWorkflowRunStatus =
  | 'completed'
  | 'action_required'
  | 'cancelled'
  | 'failure'
  | 'neutral'
  | 'skipped'
  | 'stale'
  | 'success'
  | 'timed_out'
  | 'in_progress'
  | 'queued'
  | 'requested'
  | 'waiting'
  | 'pending';

export type GithubApiVersionHeader = {
  headers: {
    'X-Github-Api-Version': string;
  };
};

export const GITHUB_FILEMODE_FILE = '100644';
export const GITHUB_FILEMODE_EXE = '100755';
export const GITHUB_FILEMODE_SUBDIR = '040000';
export const GITHUB_FILEMODE_SUBMODULE = '160000';
export const GITHUB_FILEMODE_SYMLINK = '120000';

export type GithubFileMode =
  | typeof GITHUB_FILEMODE_FILE
  | typeof GITHUB_FILEMODE_EXE
  | typeof GITHUB_FILEMODE_SUBDIR
  | typeof GITHUB_FILEMODE_SUBMODULE
  | typeof GITHUB_FILEMODE_SYMLINK;

export type GithubFileType = 'blob' | 'tree' | 'commit';

export type GithubCommitInput = {
  message: string;
  commiter?: {
    name: string;
    email: string;
    date?: string;
  };
  author?: {
    name: string;
    email: string;
    date?: string;
  };
};

export type GetGithubRepoContentInput = GithubRepoContentInfo;

export type GetGithubRepoContentRegularFileOutput = {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file';
  content: string;
  /**
   * Between 1-100 MB: Only the raw or object custom media types are supported.
   * Both will work as normal, except that when using the object media type,
   * the content field will be an empty string and the encoding field will be "none".
   * To get the contents of these larger files, use the raw media type.
   *
   * https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents
   */
  encoding: BufferEncoding;
  _links: {
    self: string;
    git: string;
    html: string;
  };
};

export type GetGithubRepoContentSubmoduleOutput = {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: null;
  type: 'submodule';
  submodule_git_url: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
};

// todo: 일반 파일을 기준으로 한 타입 입니다.
export type UpdateGithubRepoFileContentInput = GithubBranchInfo &
  GithubRepoContentInfo &
  GithubCommitInput & {
    sha?: string;
    content: string;
  };

export type GetGithubRepoBranchInput = GithubBranchInfo;

export type UpdateGithubTreeInput = GithubRepoInfo & {
  base_tree: string;
  tree: {
    path: string;
    sha: string;
    mode: GithubFileMode;
    type: GithubFileType;
  }[];
};

export type CreateGithubCommitInput = GithubRepoInfo &
  GithubCommitInput & {
    tree: string;
    parents: string[];
  };

export type UpdateGithubHeadRefInput = GithubRepoInfo & {
  ref: string;
  sha: string;
  force?: boolean;
};

export type CreateGithubWorkflowDispatchEvent = GithubRepoInfo & {
  workflow_id: string;
  ref: string;
  inputs?: Record<string, string>;
};
