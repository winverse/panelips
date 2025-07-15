import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, json, splat, ms } = winston.format;

// 파일 로그를 위한 JSON 포맷
const fileLogFormat = combine(timestamp(), json(), splat(), ms());

const dailyRotateFileOptions = {
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: fileLogFormat,
};

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    // 콘솔 로그: NestJS 기본 로거 스타일로 변경하여 가독성 향상
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'silly',
      format: combine(timestamp(), utilities.format.nestLike('Panelips', { prettyPrint: true })),
    }),

    // 에러 로그: JSON 형식으로 저장
    new winston.transports.DailyRotateFile({
      ...dailyRotateFileOptions,
      level: 'error',
      dirname: 'logs/error',
      filename: 'error-%DATE%.log',
    }),

    // 모든 정보 로그: JSON 형식으로 저장
    new winston.transports.DailyRotateFile({
      ...dailyRotateFileOptions,
      level: 'info',
      dirname: 'logs/info',
      filename: 'info-%DATE%.log',
    }),
  ],
});
