import {PositionEnum, Screen, ScreenClip, SettingsState, VisibilityEnum} from "../../../../contracts/src/lib/types";
import {uuidv4} from "../../../../utils/src/lib/uuid";
import {updateItemInDictionary} from "../../../../utils/src/lib/utils";

// It needs to be a new object
// otherwise it would take the clips refernce
// and add clips to it all the time
function createInitialScreenObj(): Screen {
  return {
    id: '',
    name: '',
    clips: {},
    height: 1080,
    width: 1920
  };
}

function createInitialScreenClipObj(): ScreenClip {
  return {
    visibility: VisibilityEnum.Play,
    position: PositionEnum.FullScreen,
    id: '',
    imgFit: 'contain'
  }
}

// region Screen Operations

export function addScreen(state: SettingsState, screen: Partial<Screen>) {
  screen.id = uuidv4();
  state.screen[screen.id] = Object.assign(createInitialScreenObj(), screen);
}

// endregion

// region Screen Clip Operations

export function fillDefaultsScreenClip (screenClip: Partial<ScreenClip>) {
  return Object.assign(createInitialScreenClipObj(), screenClip);
}

export function addOrUpdateScreenClip(state: SettingsState, screenId: string, screenClip: Partial<ScreenClip>) {
  const newScreenClipObj = fillDefaultsScreenClip(screenClip);

  updateItemInDictionary(state.screen[screenId].clips, newScreenClipObj);
}

// endregion



