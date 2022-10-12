import React from "react";
import {
  Action,
  UpdaterFn,
  ActionName,
  ActionResult,
  PanelComponentProps,
  ActionSource,
} from "./types";
import { ExcalidrawElement } from "../element/types";
import { AppClassProperties, AppState } from "../types";
import { MODES } from "../constants";
import { trackEvent } from "../analytics";
import { isPageAction } from "./register";
import { getElementsOnPage } from "../element";

const trackAction = (
  action: Action,
  source: ActionSource,
  appState: Readonly<AppState>,
  elements: readonly ExcalidrawElement[],
  app: AppClassProperties,
  value: any,
) => {
  if (action.trackEvent) {
    try {
      if (typeof action.trackEvent === "object") {
        const shouldTrack = action.trackEvent.predicate
          ? action.trackEvent.predicate(appState, elements, value)
          : true;
        if (shouldTrack) {
          trackEvent(
            action.trackEvent.category,
            action.trackEvent.action || action.name,
            `${source} (${app.device.isMobile ? "mobile" : "desktop"})`,
          );
        }
      }
    } catch (error) {
      console.error("error while logging action:", error);
    }
  }
};

export class ActionManager {
  actions = {} as Record<ActionName, Action>;

  updater: (
    action: Action,
    actionResult: ActionResult | Promise<ActionResult>,
  ) => void;

  getAppState: () => Readonly<AppState>;
  getElementsIncludingDeleted: () => readonly ExcalidrawElement[];
  app: AppClassProperties;

  constructor(
    updater: UpdaterFn,
    getAppState: () => AppState,
    getElementsIncludingDeleted: () => readonly ExcalidrawElement[],
    app: AppClassProperties,
  ) {
    this.updater = (action, actionResult) => {
      if (actionResult && "then" in actionResult) {
        actionResult.then((actionResult) => {
          updater({ ...actionResult, action } as ActionResult & {
            action: Action;
          });
        });
      } else {
        updater({ ...actionResult, action } as ActionResult & {
          action: Action;
        });
      }
    };
    this.getAppState = getAppState;
    this.getElementsIncludingDeleted = getElementsIncludingDeleted;
    this.app = app;
  }

  registerAction(action: Action) {
    this.actions[action.name] = action;
  }

  registerAll(actions: readonly Action[]) {
    actions.forEach((action) => this.registerAction(action));
  }

  private getElementsForAction(action: Action): readonly ExcalidrawElement[] {
    if (isPageAction(action.name)) {
      const { currentPageId } = this.getAppState();
      return getElementsOnPage(
        currentPageId,
        this.getElementsIncludingDeleted(),
      );
    }
    return this.getElementsIncludingDeleted();
  }

  handleKeyDown(event: React.KeyboardEvent | KeyboardEvent) {
    const canvasActions = this.app.props.UIOptions.canvasActions;
    const data = Object.values(this.actions)
      .sort((a, b) => (b.keyPriority || 0) - (a.keyPriority || 0))
      .filter(
        (action) =>
          (action.name in canvasActions
            ? canvasActions[action.name as keyof typeof canvasActions]
            : true) &&
          action.keyTest &&
          action.keyTest(
            event,
            this.getAppState(),
            this.getElementsForAction(action),
          ),
      );

    if (data.length !== 1) {
      if (data.length > 1) {
        console.warn("Canceling as multiple actions match this shortcut", data);
      }
      return false;
    }

    const action = data[0];

    const { viewModeEnabled } = this.getAppState();
    if (viewModeEnabled) {
      if (!Object.values(MODES).includes(data[0].name)) {
        return false;
      }
    }

    const elements = this.getElementsForAction(action);
    const appState = this.getAppState();
    const value = null;

    trackAction(action, "keyboard", appState, elements, this.app, null);

    event.preventDefault();
    event.stopPropagation();
    this.updater(action, action.perform(elements, appState, value, this.app));
    return true;
  }

  executeAction(action: Action, source: ActionSource = "api") {
    const elements = this.getElementsForAction(action);
    const appState = this.getAppState();
    const value = null;

    trackAction(action, source, appState, elements, this.app, value);

    this.updater(action, action.perform(elements, appState, value, this.app));
  }

  /**
   * @param data additional data sent to the PanelComponent
   */
  renderAction = (name: ActionName, data?: PanelComponentProps["data"]) => {
    const canvasActions = this.app.props.UIOptions.canvasActions;
    if (
      this.actions[name] &&
      "PanelComponent" in this.actions[name] &&
      (name in canvasActions
        ? canvasActions[name as keyof typeof canvasActions]
        : true)
    ) {
      const action = this.actions[name];
      const PanelComponent = action.PanelComponent!;
      PanelComponent.displayName = "PanelComponent";
      const elements = this.getElementsForAction(action);
      const appState = this.getAppState();
      const updateData = (formState?: any) => {
        trackAction(action, "ui", appState, elements, this.app, formState);

        this.updater(
          action,
          action.perform(
            this.getElementsForAction(action),
            this.getAppState(),
            formState,
            this.app,
          ),
        );
      };

      return (
        <PanelComponent
          elements={this.getElementsForAction(action)}
          appState={this.getAppState()}
          updateData={updateData}
          appProps={this.app.props}
          data={data}
        />
      );
    }

    return null;
  };
}
