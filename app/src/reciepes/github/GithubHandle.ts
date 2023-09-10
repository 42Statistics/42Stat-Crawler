import { Octokit } from 'octokit';
import { CrawlerError } from '../../libs/CrawlerError.js';
import type {
  GetGithubRepoContentInput,
  GetGithubRepoContentOutput,
  GithubRepoContentInfo,
  UpdateGithubRepoContentInput,
} from './GithubhandleDto.js';

export class GithubHandle {
  private readonly octokit: Octokit;

  private static readonly API_VERSION = '2022-11-28';
  private static readonly DEFAULT_ENCODING = 'base64';

  constructor(githubToken: string) {
    this.octokit = new Octokit({
      auth: githubToken,
    });
  }

  static contentToBuffer({
    content,
    encoding,
  }: Pick<GetGithubRepoContentOutput, 'content' | 'encoding'>): Buffer {
    return Buffer.from(content, encoding);
  }

  async getRepoContentData({
    owner,
    repo,
    path,
  }: GetGithubRepoContentInput): Promise<GetGithubRepoContentOutput> {
    const response = await this.octokit.request(
      `GET /repos/${owner}/${repo}/contents/${path}`
    );

    if (response.status !== 200) {
      throw new CrawlerError('코드 가져오기를 실패했습니다.');
    }

    return response.data as GetGithubRepoContentOutput;
  }

  private static updateRepoContentUrl({
    owner,
    repo,
    path,
  }: GithubRepoContentInfo): string {
    return `PUT /repos/${owner}/${repo}/contents/${path}`;
  }

  async updateRepoContent(
    updateGithubRepoContentInput: Omit<
      UpdateGithubRepoContentInput,
      'headers' | 'content'
    > & {
      content: Buffer;
    }
  ): Promise<void> {
    const input: UpdateGithubRepoContentInput = {
      ...updateGithubRepoContentInput,
      content: updateGithubRepoContentInput.content.toString(
        GithubHandle.DEFAULT_ENCODING
      ),
      headers: {
        'X-Github-Api-Version': GithubHandle.API_VERSION,
      },
    };

    const response = await this.octokit.request(
      GithubHandle.updateRepoContentUrl(updateGithubRepoContentInput),
      input
    );

    if (response.status !== 200) {
      throw new CrawlerError('코드 갱신을 실패했습니다.');
    }
  }
}
