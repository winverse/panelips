import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfig, Path, PathValue } from '@nestjs/config';
import { Config } from './config.interface.js';

@Injectable()
export class ConfigService extends NestConfig<Config> {
  public override get<P extends Path<Config>>(path: P) {
    const value = super.get(path, { infer: true });
    return value as PathValue<Config, P>;
  }
}
