import {TwitchConnector} from "../../../twitch/twitch.connector";
import {DisposableBase} from "./disposableBase";
import {takeUntil} from "rxjs/operators";
import {MediaType} from "@memebox/contracts";
import {TwitchDataProvider} from "../../../twitch/twitch.data-provider";

export class TwitchApi extends DisposableBase {

  // for permanent scripts
  public onEvent$ = this.twitchConnector.twitchEvents$().pipe(
    takeUntil(this._destroy$)
  );

  constructor(
    private twitchConnector: TwitchConnector,
    private dataProvider: TwitchDataProvider,
    private scriptType: MediaType
  ) {
    super();

    // Only Permanent Scripts as allowed to subscribe to Events
    if (scriptType === MediaType.Script) {
      this._destroy$.next();
    }
  }

  public say(message: string) {
    const tmiInstance = this.twitchConnector.tmiInstance();
    const settings = this.twitchConnector.getTwitchSettings();

    tmiInstance.say(settings.channel, message);
  }

  public async getBroadcasterIdAsync(): Promise<string> {
    const mainAuth =  await this.dataProvider.getMainTwitchAuthAsync();

    return mainAuth?.userId;
  }

  public getHelixDataAsync(endpointAndQuery: string) {
    return this.dataProvider.getHelixDataAsync(endpointAndQuery);
  }
}
