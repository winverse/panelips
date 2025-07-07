import { execSync } from 'node:child_process';
import fs from 'node:fs';

class GeneratePrismaScript {
  public execute() {
    this.checkPrismaSchema();

    try {
      const command = `npx prisma generate --schema="./prisma/schema.prisma"`;
      const stdout = execSync(command, { encoding: 'utf-8' });
      console.log('Script finished successfully.');
      if (stdout) {
        console.log(stdout);
      }
    } catch (error) {
      throw new Error('Prisma generation failed', { cause: error });
    }
  }

  private checkPrismaSchema() {
    if (!fs.existsSync('./prisma/schema.prisma')) {
      throw new Error('Not found prisma schema file');
    }
  }
}

const script = new GeneratePrismaScript();
script.execute();
