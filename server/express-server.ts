import express, {Express} from 'express';
import {
  API_PREFIX,
  CLIP_ENDPOINT,
  CLIP_ID_ENDPOINT,
  DANGER_ENDPOINT,
  FILE_BY_ID_ENDPOINT,
  FILE_ENDPOINT,
  FILES_ENDPOINT,
  LOG_ENDPOINT,
  NETWORK_IP_LIST_ENDPOINT,
  STATE_ENDPOINT,
  TAGS_ENDPOINT,
  TIMED_ENDPOINT,
  TWITCH_ENDPOINT
} from './constants';
import * as fs from 'fs';
import {listNetworkInterfaces} from "./network-interfaces";
import {PersistenceInstance} from "./persistence";

import {TAG_ROUTES} from "./rest-endpoints/tags";
import {getAppRootPath, getFiles, isInElectron, mapFileInformations} from "./file.utilts";
import {allowedFileUrl, clipValidations, validOrLeave} from "./validations";

import {DANGER_ROUTES} from "./rest-endpoints/danger";
import {LOG_ROUTES} from "./rest-endpoints/logs";
import {TWITCH_ROUTES} from "./rest-endpoints/twitch";
import {TIMER_ROUTES} from "./rest-endpoints/timers";
import {STATE_ROUTES} from "./rest-endpoints/state";
import {SERVER_URL} from "@memebox/contracts";

const {  normalize, join } = require('path');


const cors = require('cors');
const bodyParser = require('body-parser');


const app: Express = express();

app.use(cors());
app.use(bodyParser.json());

const rootPath = getAppRootPath();

app.use(express.static(rootPath));

app.get(`${API_PREFIX}/debugPaths`, (req, res) => {
  res.send({
    ELECTRON: isInElectron,
    DIR: __dirname,
    rootPath
  });
})

// todo split up endpoints

app.get(API_PREFIX, (req,res) => {
  res.send(PersistenceInstance.fullState());
});

// TODO Add CONTSTANTS Values
// TODO better to register apis?
// TODO EXTRACT Controllers as  TsED Controllers
/**
 * Clips API
 */

app.get(CLIP_ENDPOINT, (req,res) => {
  res.send(PersistenceInstance.listClips());
});

// Post = New
app.post(CLIP_ENDPOINT, clipValidations, validOrLeave, (req, res) => {
  const newClip = req.body;

  // save the clip
  // return ID
  res.send({
    ok: true,
    id: PersistenceInstance.addClip(newClip)
  });
});

// Put = Update
app.put(CLIP_ID_ENDPOINT, (req, res) => {
  // update clip
  res.send(PersistenceInstance.updateClip(req.params['clipId'], req.body));
});
// Delete
app.delete(CLIP_ID_ENDPOINT, (req, res) => {
  // delete clip
  // return ID
  res.send(PersistenceInstance.deleteClip(req.params['clipId']));
});

app.use(TAGS_ENDPOINT, TAG_ROUTES);
app.use(DANGER_ENDPOINT, DANGER_ROUTES);
app.use(LOG_ENDPOINT, LOG_ROUTES);
app.use(TWITCH_ENDPOINT, TWITCH_ROUTES);
app.use(TIMED_ENDPOINT, TIMER_ROUTES);
app.use(STATE_ENDPOINT, STATE_ROUTES);

/**
 * OBS-Specific API
 */

app.get(FILES_ENDPOINT, async (req, res) => {

  const mediaFolder = PersistenceInstance.getConfig().mediaFolder;

  // fullpath as array
  const files = await getFiles(mediaFolder);

  try {
    // files with information
    const fileInfoList = mapFileInformations(mediaFolder, files);

    res.send(fileInfoList);
  }
  catch(error)
  {
    res.status(500)
      .send({error: error.message});
  }
});

app.get(FILE_BY_ID_ENDPOINT, function(req, res){
  const mediaId = req.params['mediaId'];

  console.info(req.params);

  if (!mediaId){
    res.send('need a param');
    return;
  }

  // simple solution
  // check one path and then other
  const mediaFolder = PersistenceInstance.getConfig().mediaFolder;
  const clipMap = PersistenceInstance.fullState().clips;

  const clip = clipMap[mediaId];

  if (!clip) {
    res.send('invalid mediaId');
    return;
  }

  const filename = clip.path.replace(`${SERVER_URL}/file`, mediaFolder);

  if (fs.existsSync(filename)) {
    res.sendFile(filename);
    return;
  }

  console.error(`file not found: ${mediaId}`);

  res.status(404);
  res.send({
    ok: false
  });
});


// TODO - Remove on the next version
// dev mode : "/src/assets"
// prod mode:  "/assets"
app.get(FILE_ENDPOINT, function(req, res){
  const firstParam = req.params[0];

  if (!firstParam){
    res.send('need a param');
    return;
  }

  // possible "hack" to access some files
  // TODO check for hijacks and stuff
  if (!allowedFileUrl(firstParam)) {
    res.send('nope');
    return;
  }

  // simple solution
  // check one path and then other
  const mediaFolder = PersistenceInstance.getConfig().mediaFolder;

  const filename = normalize(`${mediaFolder}/${firstParam}`);

  if (fs.existsSync(filename)) {
    res.sendFile(filename);
    return;
  }

  console.error(`file not found: ${firstParam}`);

  res.status(404);
  res.send({
    ok: false
  });
});


// List Network IP Entries
app.get(NETWORK_IP_LIST_ENDPOINT, (req, res) => {
  res.send(listNetworkInterfaces());
});



export function createExpress(port: number) {
  app.set('port', port);

  // app.get('port')


  return app;
}
