import fs from 'node:fs';
import path from 'node:path';
import { select } from '@inquirer/prompts';

export class CopyEnvScript {
  private readonly envFolderPath: string;
  private readonly environment: Environment | '';

  constructor({ envFolderPath = './env' }: Option = {}) {
    this.envFolderPath = envFolderPath;

    const { environment } = this.parseCommandLineFlags();
    this.environment = environment;
  }

  private getEnvSourcePath(environment: Environment): string {
    return path.resolve(process.cwd(), `${this.envFolderPath}/.env.${environment}`);
  }

  private getEnvTargetPath(): string {
    return path.resolve(process.cwd(), '.env');
  }

  private validateEnvironment(environment: string): void {
    const validEnvironments: Environment[] = ['development', 'stage', 'production', 'test'];

    if (!validEnvironments.includes(environment as Environment)) {
      throw new Error(`${environment} is not allowed environment`);
    }
  }

  private async promptForEnvironment(): Promise<Environment> {
    const isOnlyDev = process.argv.includes('--only-dev');

    const choices: Environment[] = isOnlyDev
      ? ['development']
      : ['development', 'stage', 'production', 'test'];

    return select({
      message: 'Please choose a environment:',
      choices: choices.map((env) => ({
        name: env,
        value: env as Environment,
      })),
      default: 'development',
    });
  }

  private copyEnvFile(environment: Environment): void {
    const sourcePath = this.getEnvSourcePath(environment);
    const targetPath = this.getEnvTargetPath();

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Not found .env.${environment} file`);
    }

    try {
      fs.copyFileSync(sourcePath, targetPath);
      console.info(`✅ Environment file copied successfully: .env.${environment} → .env`);
    } catch (error) {
      throw new Error(
        `Failed to copy environment file: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private printSelectedLog(environment: Environment): void {
    console.info('Selected Options:');
    console.info(`environment: ${environment}`);
    console.info(`source: ${this.getEnvSourcePath(environment)}`);
    console.info(`target: ${this.getEnvTargetPath()}`);
  }

  private parseCommandLineFlags(): CommandLineFlags {
    const args = process.argv.slice(2);
    const environmentIndex = args.indexOf('-e');

    const environment =
      environmentIndex !== -1 && environmentIndex + 1 < args.length
        ? (args[environmentIndex + 1] as Environment)
        : '';

    return { environment };
  }

  public async execute(): Promise<void> {
    try {
      const environment = this.environment || (await this.promptForEnvironment());

      this.validateEnvironment(environment);
      this.printSelectedLog(environment);
      this.copyEnvFile(environment);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}

type Environment = 'development' | 'stage' | 'production' | 'test';

type Option = {
  envFolderPath?: string;
};

interface CommandLineFlags {
  environment: Environment | '';
}
