import {Service} from "@tsed/di";
import {TwitchConnector} from "./twitch.connector";
import {TwitchLogger} from "./twitch.logger";
import {TwitchHandler} from "./twitch.handler";

// This is just to have all Services created on startup

@Service()
export class TwitchBootstrap {
  constructor(
    private _connector: TwitchConnector,
    private _logger: TwitchLogger,
    private _twitchHandler: TwitchHandler
  ) {
  }
}
