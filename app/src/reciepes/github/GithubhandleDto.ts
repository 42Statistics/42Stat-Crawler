export type GithubRepoContentInfo = {
  owner: string;
  repo: string;
  path: string;
};

export type GetGithubRepoContentInput = GithubRepoContentInfo;

export type GetGithubRepoContentOutput = {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
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

export type UpdateGithubRepoContentInput = GithubRepoContentInfo & {
  sha: string;
  message: string;
  commiter?: {
    name: string;
    email: string;
  };
  content: string;
  headers: {
    'X-Github-Api-Version': string;
  };
};
