import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfig, Path, PathValue } from '@nestjs/config';

@Injectable()
export class ConfigService<T> extends NestConfig<T> {
  public override get<P extends Path<T>>(path: P) {
    const value = super.get(path, { infer: true });
    return value as PathValue<T, P>;
  }
}
