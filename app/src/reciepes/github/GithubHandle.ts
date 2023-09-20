import { Octokit } from 'octokit';
import { CrawlerError } from '../../libs/CrawlerError.js';
import {
  CreateGithubWorkflowDispatchEvent,
  GITHUB_FILEMODE_SUBMODULE,
  type CreateGithubCommitInput,
  type GetGithubRepoBranchInput,
  type GetGithubRepoContentInput,
  type GetGithubRepoFileContentOutput,
  type GithubApiVersionHeader,
  type UpdateGithubHeadRefInput,
  type UpdateGithubRepoFileContentInput,
  type UpdateGithubTreeInput,
} from './GithubhandleDto.js';

export class GithubHandle {
  private readonly octokit: Octokit;

  private static readonly API_VERSION_HEADER: GithubApiVersionHeader = {
    headers: { 'X-Github-Api-Version': '2022-11-28' },
  };

  private static readonly DEFAULT_FILE_ENCODING = 'base64';

  private static readonly GET_REPO_CONTENT_URL = `GET /repos/{owner}/{repo}/contents/{path}`;
  private static readonly UPDATE_REPO_CONTENT_URL = `PUT /repos/{owner}/{repo}/contents/{path}`;
  private static readonly GET_BRANCH_URL = `GET /repos/{owner}/{repo}/branches/{branch}`;
  private static readonly UPDATE_GIT_TREE_URL = `POST /repos/{owner}/{repo}/git/trees`;
  private static readonly CREATE_COMMIT_URL = `POST /repos/{owner}/{repo}/git/commits`;
  private static readonly UPDATE_HEAD_REF = `PATCH /repos/{owner}/{repo}/git/refs/{ref}`;
  private static readonly CREATE_WORKFLOW_DISPATCH_EVENT = `POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches`;
  private static readonly GET_WORKFLOW_RUNS = `GET /repos/{owner}/{repo}/actions/runs`;

  constructor(githubToken: string) {
    this.octokit = new Octokit({
      auth: githubToken,
    });
  }

  static contentToBuffer({
    content,
    encoding,
  }: Pick<GetGithubRepoFileContentOutput, 'content' | 'encoding'>): Buffer {
    return Buffer.from(content, encoding);
  }

  async getRepoFileContentData(
    input: GetGithubRepoContentInput
  ): Promise<GetGithubRepoFileContentOutput> {
    const response = await this.octokit.request(
      GithubHandle.GET_REPO_CONTENT_URL,
      { ...input, ...GithubHandle.API_VERSION_HEADER }
    );

    return response.data as GetGithubRepoFileContentOutput;
  }

  async updateRepoFileContent(
    input: Omit<UpdateGithubRepoFileContentInput, 'content'> & {
      content: Buffer;
    }
  ): Promise<string> {
    const response = await this.octokit.request(
      GithubHandle.UPDATE_REPO_CONTENT_URL,
      {
        ...input,
        content: input.content.toString(GithubHandle.DEFAULT_FILE_ENCODING),
        ...GithubHandle.API_VERSION_HEADER,
      }
    );

    if (!response.data.commit.sha) {
      throw new CrawlerError('코드 갱신을 실패했습니다.');
    }

    return response.data.commit.sha;
  }

  async updateSubmodule({
    main,
    submodule,
    message,
  }: {
    main: GetGithubRepoBranchInput & { submodulePath: string };
    submodule: GetGithubRepoBranchInput;
    message: string;
  }): Promise<void> {
    const mainInfo = await this.getBranchInfo(main);
    const submoduleInfo = await this.getBranchInfo(submodule);

    const newTreeSha = await this.updateGitTree({
      ...main,
      base_tree: mainInfo.commit.sha,
      tree: [
        {
          path: main.submodulePath,
          mode: GITHUB_FILEMODE_SUBMODULE,
          type: 'commit',
          sha: submoduleInfo.commit.sha,
        },
      ],
    });

    const newHead = await this.createCommit({
      ...main,
      message,
      tree: newTreeSha,
      parents: [mainInfo.commit.sha],
    });

    await this.updateHeadRef({
      ...main,
      ref: `heads/${main.branch}`,
      sha: newHead,
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private async getBranchInfo(input: GetGithubRepoBranchInput) {
    const response = await this.octokit.request(GithubHandle.GET_BRANCH_URL, {
      ...input,
      ...GithubHandle.API_VERSION_HEADER,
    });

    return response.data;
  }

  private async updateGitTree(input: UpdateGithubTreeInput): Promise<string> {
    const response = await this.octokit.request(
      GithubHandle.UPDATE_GIT_TREE_URL,
      { ...input, ...GithubHandle.API_VERSION_HEADER }
    );

    return response.data.sha;
  }

  private async createCommit(input: CreateGithubCommitInput): Promise<string> {
    const response = await this.octokit.request(
      GithubHandle.CREATE_COMMIT_URL,
      { ...input, ...GithubHandle.API_VERSION_HEADER }
    );

    return response.data.sha;
  }

  private async updateHeadRef(input: UpdateGithubHeadRefInput): Promise<void> {
    await this.octokit.request(GithubHandle.UPDATE_HEAD_REF, {
      ...input,
      ...GithubHandle.API_VERSION_HEADER,
    });
  }

  async createWorkflowDispathEvent(
    input: CreateGithubWorkflowDispatchEvent
  ): Promise<void> {
    await this.octokit.request(GithubHandle.CREATE_WORKFLOW_DISPATCH_EVENT, {
      ...input,
      ...GithubHandle.API_VERSION_HEADER,
    });
  }
}
