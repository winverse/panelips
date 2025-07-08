import fs from 'node:fs';
import path from 'node:path';
import {
  GetParameterCommand,
  GetParameterCommandInput,
  PutParameterCommand,
  PutParameterCommandInput,
  SSMClient,
} from '@aws-sdk/client-ssm';
import { select } from '@inquirer/prompts';

export class SSMScript {
  private readonly packageName: string;
  private readonly envFolderPath: string;
  private readonly region: string;
  private readonly ssmPrefix: string;
  private readonly client: SSMClient;
  private environment: Environment | '';
  private readonly version: number;

  constructor({
    packageName,
    envFolderPath = './env',
    region = 'ap-northeast-2',
    ssmPrefix = '/panelips',
  }: Option) {
    this.packageName = packageName;
    this.envFolderPath = envFolderPath;
    this.region = region;
    this.ssmPrefix = ssmPrefix;
    this.client = new SSMClient({ region: this.region });

    const { environment, version } = this.parseCommandLineFlags();
    this.environment = environment;
    this.version = version;
  }

  private getParameterName(): string {
    const baseName = `${this.ssmPrefix}/${this.packageName}/${this.environment}`;
    return this.version > 0 ? `${baseName}:${this.version}` : baseName;
  }

  private getEnvFilePath(): string {
    return path.resolve(process.cwd(), `${this.envFolderPath}/.env.${this.environment}`);
  }

  private readEnvFile(): string {
    const filePath = this.getEnvFilePath();

    if (!fs.existsSync(filePath)) {
      throw new Error(`Not found .env.${this.environment} file`);
    }

    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (_error) {
      throw new Error(`Failed to read environment file: ${filePath}`);
    }
  }

  private writeEnvFile(content: string): void {
    const filePath = this.getEnvFilePath();
    const directory = path.dirname(filePath);

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    try {
      fs.writeFileSync(filePath, content, { encoding: 'utf-8' });
    } catch (_error) {
      throw new Error(`Failed to write environment file: ${filePath}`);
    }
  }

  private validateInputs(command: string, environment: string): void {
    const validCommands: OperationType[] = ['push', 'pull'];
    const validEnvironments: Environment[] = ['development', 'stage', 'production', 'test'];

    if (!validCommands.includes(command as OperationType)) {
      throw new Error(`${command} is not allowed operation type`);
    }

    if (!validEnvironments.includes(environment as Environment)) {
      throw new Error(`${environment} is not allowed environment`);
    }
  }

  private async promptForMissingInputs(): Promise<{
    command: OperationType;
    environment: Environment;
  }> {
    const choices: Choices = {
      command: ['push', 'pull'],
      environment: ['development', 'stage', 'production', 'test'],
    };

    let command: OperationType | undefined;
    let environment: Environment | undefined;

    if (!process.argv[2]) {
      command = await select({
        message: 'Please choose the operation type:',
        choices: choices.command.map((cmd) => ({
          name: cmd,
          value: cmd as OperationType,
        })),
      });
    }

    if (!this.environment) {
      environment = await select({
        message: 'Please choose a environment:',
        choices: choices.environment.map((env) => ({
          name: env,
          value: env as Environment,
        })),
      });
    }

    return {
      command: (process.argv[2] as OperationType) || command,
      environment: (this.environment as Environment) || environment,
    };
  }

  private printSelectedLog(command: OperationType, environment: Environment): void {
    console.info('Selected Options:');
    console.info(`command: ${command}`);
    console.info(`environment: ${environment}`);
    console.info(`package: ${this.packageName}`);

    if (this.version > 0) {
      console.info(`version: ${this.version}`);
    }

    console.info(`parameter: ${this.getParameterName()}`);
  }

  public async execute(): Promise<void> {
    if (!this.packageName) {
      throw new Error('packageName is required');
    }

    try {
      const { command, environment } = await this.promptForMissingInputs();
      this.validateInputs(command, environment);

      this.environment = environment;
      this.printSelectedLog(command, environment);

      const operations = {
        push: () => this.push(),
        pull: () => this.pull(),
      };

      await operations[command]();
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  private async pull(): Promise<void> {
    const parameterName = this.getParameterName();

    try {
      console.info('Pulling parameter from SSM...');

      const response = await this.fetchParameterFromSSM(parameterName);
      const envContent = this.parseParameterValue(response.Parameter?.Value);

      this.writeEnvFile(envContent);

      console.info(
        `✅ Parameter download successful! path: ${parameterName}, version: ${response.Parameter?.Version}`,
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'ParameterNotFound') {
        throw new Error(`Parameter not found: ${parameterName}`);
      }
      throw error;
    }
  }

  private async fetchParameterFromSSM(parameterName: string) {
    const input: GetParameterCommandInput = {
      Name: parameterName,
      WithDecryption: true,
    };

    const command = new GetParameterCommand(input);
    return await this.client.send(command);
  }

  private parseParameterValue(value: string | undefined): string {
    if (!value) {
      throw new Error('The path parameter exists, but retrieving the value failed');
    }

    try {
      return JSON.parse(value);
    } catch {
      throw new Error('Parameter value is not valid JSON');
    }
  }

  private async push(): Promise<void> {
    const parameterName = this.getParameterName();

    try {
      console.info('Pushing parameter to SSM...');
      const envContent = this.readEnvFile();
      const response = await this.uploadParameterToSSM(parameterName, envContent);

      console.info(
        `✅ Parameter upload successful! path: ${parameterName}, version: ${response.Version}`,
      );
    } catch (error) {
      throw new Error(
        `Failed to push parameter: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async uploadParameterToSSM(parameterName: string, envContent: string) {
    const input: PutParameterCommandInput = {
      Name: parameterName,
      Value: JSON.stringify(envContent),
      Overwrite: true,
      Type: 'SecureString',
      Description: `Environment variables for ${this.packageName} (${this.environment})`,
    };

    const command = new PutParameterCommand(input);
    return await this.client.send(command);
  }

  private parseCommandLineFlags(): CommandLineFlags {
    const args = process.argv.slice(3);

    const environmentIndex = args.indexOf('-e');
    const versionIndex = args.indexOf('-v');

    const environment =
      environmentIndex !== -1 && environmentIndex + 1 < args.length
        ? (args[environmentIndex + 1] as Environment)
        : '';

    let version = 0;
    if (versionIndex !== -1 && versionIndex + 1 < args.length) {
      const versionStr = args[versionIndex + 1];
      version = Number(versionStr);

      if (Number.isNaN(version) || version < 0) {
        throw new Error('Invalid version format. The version must be a numeric value');
      }
    }

    return { environment, version };
  }
}

type OperationType = 'push' | 'pull';
type Environment = 'development' | 'stage' | 'production' | 'test';

type Option = {
  packageName: string;
  envFolderPath?: string;
  region?: string;
  ssmPrefix?: string;
};

type Choices = {
  command: OperationType[];
  environment: Environment[];
};

interface CommandLineFlags {
  environment: Environment | '';
  version: number;
}
