import React, { useState } from "react";
import { AppState, ExcalidrawProps } from "../types";
import { ActionManager } from "../actions/manager";
import { t } from "../i18n";
import { showSelectedShapeActions } from "../element";
import { NonDeletedExcalidrawElement, PointerType } from "../element/types";
import { calculateScrollCenter } from "../scene";
import { SelectedShapeActionsCompact } from "./Actions";
import CollabButton from "./CollabButton";
import { SCROLLBAR_WIDTH, SCROLLBAR_MARGIN } from "../scene/scrollbars";
import { UserList } from "./UserList";
import { BackgroundPickerAndDarkModeToggle } from "./BackgroundPickerAndDarkModeToggle";
import { Stats } from "./Stats";
import { actionToggleCanvasMenu, actionToggleStats } from "../actions";
import { shapeImage, SHAPES } from "../shapes";
import { ToolButton } from "./ToolButton";
import {
  capitalizeString,
  setCursorForShape,
  updateActiveTool,
} from "../utils";
import { trackEvent } from "../analytics";
import "./AlternativeMobileMenu.scss";
import { cameraIcon, imageIcon } from "./icons";
import clsx from "clsx";

type AlternativeMobileMenuProps = {
  appState: AppState;
  actionManager: ActionManager;
  renderJSONExportDialog: () => React.ReactNode;
  renderImageExportDialog: () => React.ReactNode;
  setAppState: React.Component<any, AppState>["setState"];
  elements: readonly NonDeletedExcalidrawElement[];
  onCollabButtonClick?: () => void;
  onLockToggle: () => void;
  onPenModeToggle: () => void;
  canvas: HTMLCanvasElement | null;
  isCollaborating: boolean;
  renderCustomFooter?: (
    isMobile: boolean,
    appState: AppState,
  ) => JSX.Element | null;
  onImageAction: (data: { insertOnCanvasDirectly: boolean }) => void;
  renderTopRightUI?: (
    isMobile: boolean,
    appState: AppState,
  ) => JSX.Element | null;
  renderCustomStats?: ExcalidrawProps["renderCustomStats"];
  UIOptions: ExcalidrawProps["UIOptions"];
};

export const AlternativeMobileMenu = ({
  appState,
  elements,
  actionManager,
  renderJSONExportDialog,
  renderImageExportDialog,
  setAppState,
  onCollabButtonClick,
  onLockToggle,
  onPenModeToggle,
  canvas,
  isCollaborating,
  renderCustomFooter,
  onImageAction,
  renderTopRightUI,
  renderCustomStats,
  UIOptions,
}: AlternativeMobileMenuProps) => {
  const renderAppToolbar = () => {
    if (appState.viewModeEnabled) {
      return (
        <div className="App-toolbar-content">
          {actionManager.renderAction("toggleCanvasMenu")}
        </div>
      );
    }

    return (
      <div className="App-toolbar-content alt-mobile">
        <div>
          <ToolButton icon={imageIcon} type="button" aria-label="library" />
          {actionManager.renderAction(
            appState.multiElement ? "finalize" : "duplicateSelection",
          )}
        </div>
        <div>
          {actionManager.renderAction("prevPage")}
          <CircularShapesSwitcher
            activeTool={appState.activeTool}
            appState={appState}
            canvas={canvas}
            setAppState={setAppState}
            onImageAction={({ pointerType }) => {
              onImageAction({
                insertOnCanvasDirectly: pointerType !== "mouse",
              });
            }}
          />
          {actionManager.renderAction("nextPage")}
        </div>
        <div>
          <ToolButton
            visible={false}
            icon={imageIcon}
            type="button"
            aria-label="library"
          />
          {actionManager.renderAction("addPage")}
        </div>
      </div>
    );
  };

  const renderCanvasActions = () => {
    if (appState.viewModeEnabled) {
      return (
        <>
          {renderJSONExportDialog()}
          {renderImageExportDialog()}
        </>
      );
    }
    return (
      <div className="canvas-actions-container">
        {<BackgroundPickerAndDarkModeToggle actionManager={actionManager} />}
        {actionManager.renderAction("clearCanvas")}
        {actionManager.renderAction("loadScene")}
        {renderJSONExportDialog()}
        {renderImageExportDialog()}
        {onCollabButtonClick && !UIOptions?.disableCollaboration && (
          <CollabButton
            isCollaborating={isCollaborating}
            collaboratorCount={appState.collaborators.size}
            onClick={onCollabButtonClick}
          />
        )}
      </div>
    );
  };
  return (
    <>
      <div className="alt-mobile-buttons-top">
        <div style={{ display: "flex", gap: "5px" }}>
          {actionManager.renderAction("toggleCanvasMenu")}
          <ToolButton
            type="button"
            icon={cameraIcon}
            onClick={() => onImageAction({ insertOnCanvasDirectly: true })}
            aria-label={`toolBar.${shapeImage.value}`}
          />
        </div>
        {/* <div style={{ display: "flex", gap: "10px" }}> */}
        {/* </div> */}
        {actionManager.renderAction("deletePage")}
        <div style={{ display: "flex", gap: "5px" }}>
          {actionManager.renderAction("undo")}
          {actionManager.renderAction("redo")}
        </div>
      </div>
      <div
        className={clsx("canvas-actions-container-backdrop", {
          visible: appState.openMenu === "canvas",
        })}
        onClick={(e) => {
          e.stopPropagation();
          e.bubbles = false;
          actionManager.executeAction(actionToggleCanvasMenu);
        }}
      />
      <div
        className={clsx("alt-mobile-canvas-menu", {
          visible: appState.openMenu === "canvas",
        })}
      >
        {renderCanvasActions()}
        {renderCustomFooter?.(true, appState)}
        {appState.collaborators.size > 0 && (
          <fieldset>
            <legend>{t("labels.collaborators")}</legend>
            <UserList
              mobile
              collaborators={appState.collaborators}
              actionManager={actionManager}
            />
          </fieldset>
        )}
      </div>
      {!appState.openMenu && appState.showStats && (
        <Stats
          appState={appState}
          setAppState={setAppState}
          elements={elements}
          onClose={() => {
            actionManager.executeAction(actionToggleStats);
          }}
          renderCustomStats={renderCustomStats}
        />
      )}
      <div
        className="App-bottom-bar"
        style={{
          marginBottom: SCROLLBAR_WIDTH + SCROLLBAR_MARGIN,
          marginLeft: SCROLLBAR_WIDTH + SCROLLBAR_MARGIN,
          marginRight: SCROLLBAR_WIDTH + SCROLLBAR_MARGIN,
        }}
      >
        <div className="selected-shape-actions-container">
          {!appState.viewModeEnabled &&
          !appState.draggingElement &&
          showSelectedShapeActions(appState, elements) ? (
            <SelectedShapeActionsCompact
              appState={appState}
              elements={elements}
              renderAction={actionManager.renderAction}
              isMobile={true}
            />
          ) : null}
          <footer className="App-toolbar">
            {renderAppToolbar()}
            {appState.scrolledOutside &&
              !appState.openMenu &&
              appState.openSidebar !== "library" && (
                <button
                  className="scroll-back-to-content"
                  onClick={() => {
                    setAppState({
                      ...calculateScrollCenter(elements, appState, canvas),
                    });
                  }}
                >
                  {t("buttons.scrollBackToContent")}
                </button>
              )}
          </footer>
        </div>
      </div>
    </>
  );
};

const MOBILE_SHAPES = SHAPES.filter((s) => !["image"].includes(s.value));

export const CircularShapesSwitcher = ({
  canvas,
  activeTool,
  setAppState,
  onImageAction,
  appState,
}: {
  canvas: HTMLCanvasElement | null;
  activeTool: AppState["activeTool"];
  setAppState: React.Component<any, AppState>["setState"];
  onImageAction: (data: { pointerType: PointerType | null }) => void;
  appState: AppState;
}) => {
  const [expanded, setExpanded] = useState(false);
  const currentTool = SHAPES.find((s) => s.value === appState.activeTool.type);
  const radius = expanded ? 160 : 0;
  return (
    <div className="circular-shapes-switcher">
      <div
        className={clsx("backdrop", {
          visible: expanded,
        })}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.bubbles = false;
          expanded && setExpanded(false);
        }}
      />
      {MOBILE_SHAPES.map(({ value, icon, key }, index) => {
        const label = t(`toolBar.${value}`);
        const letter = key && (typeof key === "string" ? key : key[0]);
        const shortcut = letter
          ? `${capitalizeString(letter)} ${t("helpDialog.or")} ${index + 1}`
          : `${index + 1}`;
        const deg = ((180 / MOBILE_SHAPES.length) * index + 192) % 360;
        return (
          <div
            key={value}
            className={clsx("tool-circle-button", {
              current: currentTool?.value === value,
            })}
            style={{
              transform: `rotate(${deg}deg) translate(${radius}px) rotate(${-deg}deg)`,
            }}
          >
            <ToolButton
              className="Shape mobile"
              key={value}
              type="radio"
              icon={icon}
              size="medium"
              checked={activeTool.type === value}
              name="editor-current-shape"
              title={`${capitalizeString(label)} — ${shortcut}`}
              aria-label={capitalizeString(label)}
              aria-keyshortcuts={shortcut}
              data-testid={value}
              onPointerDown={({ pointerType }) => {
                setExpanded(!expanded);
                if (!appState.penDetected && pointerType === "pen") {
                  setAppState({
                    penDetected: true,
                    penMode: true,
                  });
                }
                if (appState.activeTool.type !== value) {
                  trackEvent("toolbar", value, "ui");
                }
                const nextActiveTool = updateActiveTool(appState, {
                  type: value,
                });
                setAppState({
                  activeTool: nextActiveTool,
                  multiElement: null,
                  selectedElementIds: {},
                });
                setCursorForShape(canvas, {
                  ...appState,
                  activeTool: nextActiveTool,
                });
                if (value === "image") {
                  onImageAction({ pointerType });
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
