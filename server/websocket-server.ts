import {TriggerClip} from "@memebox/contracts";
import {CURRENT_MEMEBOX_WEBSOCKET} from "./providers/websockets/memebox.websocket";
import {CURRENT_MEMEBOX_MEDIATRIGGER_EVENT_BUS} from "./providers/media-trigger.event-bus";

// Once all services are in the TsED way - these functions can be removed

export async function triggerMediaClipById(payloadObs: TriggerClip) {
  return CURRENT_MEMEBOX_MEDIATRIGGER_EVENT_BUS.triggerMedia(payloadObs);
}


export async function sendDataToAllSockets(message: string) {
  return CURRENT_MEMEBOX_WEBSOCKET?.sendDataToAllSockets(message);
}
