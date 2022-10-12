import { Action } from "./types";

export let actions: readonly Action[] = [];
const pageActions = {} as { [actionName in Action["name"]]: boolean };

export const register = <T extends Action>(action: T) => {
  actions = actions.concat(action);
  if (!action.isCrossPageAction) {
    pageActions[action.name] = true;
  }
  return action as T & {
    keyTest?: unknown extends T["keyTest"] ? never : T["keyTest"];
  };
};

export const isPageAction = (actionName: Action["name"]): boolean =>
  pageActions[actionName];
