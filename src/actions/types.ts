import React from "react";
import { ExcalidrawElement } from "../element/types";
import {
  AppClassProperties,
  AppState,
  ExcalidrawProps,
  BinaryFiles,
  AppProps,
} from "../types";

export type ActionSource = "ui" | "keyboard" | "contextMenu" | "api";

/** if false, the action should be prevented */
export type ActionResult =
  | {
      elements?: readonly ExcalidrawElement[] | null;
      appState?: MarkOptional<
        AppState,
        "offsetTop" | "offsetLeft" | "width" | "height"
      > | null;
      files?: BinaryFiles | null;
      commitToHistory: boolean;
      syncHistory?: boolean;
      replaceFiles?: boolean;
    }
  | false;

type ActionFn = (
  elements: readonly ExcalidrawElement[],
  appState: Readonly<AppState>,
  formData: any,
  app: AppClassProperties,
) => ActionResult | Promise<ActionResult>;

export type UpdaterFn = (res: ActionResult & { action: Action }) => void;
export type ActionFilterFn = (action: Action) => void;

export type ActionName =
  | "nextPage"
  | "prevPage"
  | "addPage"
  | "deletePage"
  | "copy"
  | "cut"
  | "paste"
  | "copyAsPng"
  | "copyAsSvg"
  | "copyText"
  | "sendBackward"
  | "bringForward"
  | "sendToBack"
  | "bringToFront"
  | "copyStyles"
  | "selectAll"
  | "pasteStyles"
  | "gridMode"
  | "zenMode"
  | "stats"
  | "changeStrokeColor"
  | "changeBackgroundColor"
  | "changeFillStyle"
  | "changeStrokeWidth"
  | "changeStrokeShape"
  | "changeSloppiness"
  | "changeStrokeStyle"
  | "changeArrowhead"
  | "changeOpacity"
  | "changeFontSize"
  | "toggleCanvasMenu"
  | "toggleEditMenu"
  | "undo"
  | "redo"
  | "finalize"
  | "changeProjectName"
  | "changeExportBackground"
  | "changeExportEmbedScene"
  | "changeExportScale"
  | "saveToActiveFile"
  | "saveFileToDisk"
  | "loadScene"
  | "duplicateSelection"
  | "deleteSelectedElements"
  | "changeViewBackgroundColor"
  | "clearCanvas"
  | "zoomIn"
  | "zoomOut"
  | "resetZoom"
  | "zoomToFit"
  | "zoomToSelection"
  | "changeFontFamily"
  | "changeTextAlign"
  | "changeVerticalAlign"
  | "toggleFullScreen"
  | "toggleShortcuts"
  | "group"
  | "ungroup"
  | "goToCollaborator"
  | "addToLibrary"
  | "changeSharpness"
  | "alignTop"
  | "alignBottom"
  | "alignLeft"
  | "alignRight"
  | "alignVerticallyCentered"
  | "alignHorizontallyCentered"
  | "distributeHorizontally"
  | "distributeVertically"
  | "flipHorizontal"
  | "flipVertical"
  | "viewMode"
  | "exportWithDarkMode"
  | "toggleTheme"
  | "increaseFontSize"
  | "decreaseFontSize"
  | "unbindText"
  | "hyperlink"
  | "eraser"
  | "bindText"
  | "toggleLock"
  | "toggleLinearEditor";

export type PanelComponentProps = {
  elements: readonly ExcalidrawElement[];
  appState: AppState;
  updateData: (formData?: any) => void;
  appProps: ExcalidrawProps;
  data?: Record<string, any>;
};

export interface Action {
  name: ActionName;
  isCrossPageAction?: boolean;
  PanelComponent?: React.FC<PanelComponentProps>;
  perform: ActionFn;
  keyPriority?: number;
  keyTest?: (
    event: React.KeyboardEvent | KeyboardEvent,
    appState: AppState,
    elements: readonly ExcalidrawElement[],
  ) => boolean;
  contextItemLabel?:
    | string
    | ((
        elements: readonly ExcalidrawElement[],
        appState: Readonly<AppState>,
      ) => string);
  contextItemPredicate?: (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    appProps: AppProps,
  ) => boolean;
  checked?: (appState: Readonly<AppState>) => boolean;
  trackEvent:
    | false
    | {
        category:
          | "toolbar"
          | "element"
          | "canvas"
          | "export"
          | "history"
          | "menu"
          | "collab"
          | "hyperlink";
        action?: string;
        predicate?: (
          appState: Readonly<AppState>,
          elements: readonly ExcalidrawElement[],
          value: any,
        ) => boolean;
      };
}
