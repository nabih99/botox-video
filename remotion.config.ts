import {existsSync} from 'node:fs';
import {Config} from '@remotion/cli/config';

const chrome = process.env.CHROME_PATH ?? '/usr/bin/chromium';
if (existsSync(chrome)) Config.setBrowserExecutable(chrome);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setCrf(16);
Config.setVideoImageFormat('png');
Config.setConcurrency(3);
Config.setOverwriteOutput(true);
Config.setAudioBitrate('192k');
