import {Dictionary, ScreenMediaOverridableProperties} from "./types";
import {AllTwitchEvents} from "../../../../server/providers/twitch/twitch.connector.types";

export const ACTIONS = {
  I_AM_OBS: 'I_AM_OBS',
  TRIGGER_CLIP: 'TRIGGER_CLIP',  // the only "public" websocket action
  UPDATE_MEDIA: 'UPDATE_MEDIA',
  UPDATE_DATA: 'UPDATE_DATA',
  RELOAD_SCREEN: 'RELOAD_SCREEN',

  MEDIA_STATE: 'MEDIA_STATE',

  // todo trigger websocket calls from screens
  REGISTER_SCREEN_INSTANCE: 'REGISTER_SCREEN_INSTANCE',
  UNREGISTER_SCREEN_INSTANCE: 'UNREGISTER_SCREEN_INSTANCE',

  // payload="mediaId|instanceId"
  REGISTER_WIDGET_INSTANCE: 'REGISTER_WIDGET_INSTANCE',
  UNREGISTER_WIDGET_INSTANCE: 'UNREGISTER_WIDGET_INSTANCE',
}

export enum TriggerClipOrigin {
  Unknown,
  AppPreview,
  StreamDeck, // currently also Unknown
  TwitchEvent,
  Timer,
  Meta,
  Scripts
}

/**
 * TODO RENAME because of the other TriggerBase
 */
export interface InternalActionTriggerBase {

  id: string;   // actionId
  targetScreen?: string;

  fromWebsocket?: boolean;
  origin?: TriggerClipOrigin;
  originId?: string;
}

export interface ActionOverridableProperties {
  variables?: Dictionary<unknown>;
}

export interface TriggerActionOverrides {
  /** examples / ideas
   *
   *  action: {
           visibleTime: newVal(),
           volume: newVolume(),
           variables: {
             someVarOfScript: 42,
             otherVar: "just Do eeet"
           }
         },
   screenMedia: {
           position: 'absolute',
           top: '20%',
           right: '5%'
         },
   extra: {
           // stuff only script / widgets can understand?
         }

   *
   */

  action?: ActionOverridableProperties;

  screenMedia?: ScreenMediaOverridableProperties

}

export interface TriggerAction extends InternalActionTriggerBase {
  // TODO an unique triggerActionId to follow

  repeatX?: number;
  repeatSecond?: number;

  overrides?: TriggerActionOverrides;
  useOverridesAsBase?: boolean;

  // soon there will be more "overrides" to everything

  byTwitch?: AllTwitchEvents;
}

export interface TriggerActionUpdate extends InternalActionTriggerBase {
  screenMedia?: ScreenMediaOverridableProperties
}

export enum ActionStateEnum {
  Unset,
  Triggered,
  Active,
  Done
}

export interface ActionActiveStatePayload {
  mediaId: string;
  screenId?: string;
  state: ActionStateEnum;
}
