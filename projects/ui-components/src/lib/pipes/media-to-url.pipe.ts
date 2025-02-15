import {Pipe, PipeTransform} from '@angular/core';
import {EXPRESS_BASE} from "@memebox/app-state";
import {Clip, SERVER_URL} from "@memebox/contracts";

@Pipe({
  name: 'mediaToUrl'
})
export class MediaToUrlPipe implements PipeTransform {

  transform(media: Clip, useOldWay = false): string {
    if (media.path?.includes(SERVER_URL) && media.id && !useOldWay) {
      return `${EXPRESS_BASE}/fileById/${media.id}`;
    } else {
      // Online URL (not local) OR new media dialog
      return replaceholder(media.path);
    }
  }
}

function replaceholder (value: string): string{
  if (value) {
    return value.replace(SERVER_URL, EXPRESS_BASE);
  }

  return '';
}

@Pipe({
  name: 'mediaPathToUrl'
})
export class MediaPathToUrlPipe implements PipeTransform {

  transform(mediaPath: string): string {
    return replaceholder(mediaPath);
  }
}
