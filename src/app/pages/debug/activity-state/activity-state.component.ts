import {Component, OnInit} from '@angular/core';
import {ActivityQueries, AppQueries, AppService} from "@memebox/app-state";
import {filter, map} from "rxjs/operators";
import {ActionStateEnum, MEDIA_TYPE_INFORMATION, MediaType} from "@memebox/contracts";
import {combineLatest} from "rxjs";

function actionStateEnumToString (activity: ActionStateEnum) {
  switch (activity) {
    case ActionStateEnum.Done:
      return 'Done';
    case ActionStateEnum.Active:
      return 'Active';
    case ActionStateEnum.Unset:
      return 'Unset';
    case ActionStateEnum.Triggered:
      return 'Triggered';
  }
}

@Component({
  selector: 'app-activity-state',
  templateUrl: './activity-state.component.html',
  styleUrls: ['./activity-state.component.scss']
})
export class ActivityStateComponent implements OnInit {

  actions$ = combineLatest([
    this.activityState.state$,
    this.appState.actionMap$.pipe(
      filter(actionMap => !!actionMap)
    )
  ]).pipe(
    map(([activityState, actionMap]) => {
      const actionKeys = Object.keys(activityState);

      return actionKeys.map(actionId => {
        const statesOfAction = activityState[actionId];
        const keysOfStates = Object.keys(statesOfAction);

        let activityOfAction = '';

        if (keysOfStates.includes(actionId)) {
          activityOfAction =  actionStateEnumToString(statesOfAction[actionId])
        }

        const stateInScreen = keysOfStates.filter(key => key !== actionId)
          .map(key => {
            return {
              screenId: key,
              state:  actionStateEnumToString(statesOfAction[key])
            }
          });

        const actionInfo = actionMap[actionId];
        const actionType = actionInfo?.type ?? MediaType.Invalid;

        

        return {
          id: actionId,
          name: actionInfo?.name,
          actionType,
          actionTypeString: MEDIA_TYPE_INFORMATION[actionType]?.labelFallback,
          activityOfAction,
          stateInScreen
        }
      }).filter(entry => entry.actionType !== MediaType.PermanentScript)
    })
  )

  constructor(
    public activityState: ActivityQueries,
    public appState: AppQueries,
    public appService: AppService,
  ) {
    appService.loadState();
  }

  ngOnInit(): void {
  }

}
