import clsx from "clsx";
import {
  actionAddPage,
  actionDeletePage,
  actionNextPage,
  actionPrevPage,
} from "../actions";
import { ActionManager } from "../actions/manager";
import { isFixedSizePage } from "../element";
import Scene from "../scene/Scene";
import { AppState, ExcalidrawProps } from "../types";
import {
  ExitZenModeAction,
  FinalizeAction,
  UndoRedoActions,
  ZoomActions,
} from "./Actions";
import { useDevice } from "./App";
import { Island } from "./Island";
import { PageAwarenessDesktop } from "./PageAwareness";
import { Section } from "./Section";
import Stack from "./Stack";

const Footer = ({
  appState,
  actionManager,
  renderCustomFooter,
  showExitZenModeBtn,
  scene,
}: {
  appState: AppState;
  actionManager: ActionManager;
  renderCustomFooter?: ExcalidrawProps["renderFooter"];
  showExitZenModeBtn: boolean;
  scene: Scene;
}) => {
  const device = useDevice();
  const showFinalize =
    !appState.viewModeEnabled && appState.multiElement && device.isTouchScreen;
  const currentPage = scene.getCurrentPageElement();
  const zoomActionsEnabled = !(currentPage && isFixedSizePage(currentPage));
  return (
    <footer
      role="contentinfo"
      className="layer-ui__wrapper__footer App-menu App-menu_bottom"
    >
      <div
        className={clsx("layer-ui__wrapper__footer-left zen-mode-transition", {
          "layer-ui__wrapper__footer-left--transition-left":
            appState.zenModeEnabled,
        })}
      >
        <Stack.Col gap={2}>
          <Section heading="canvasActions">
            {zoomActionsEnabled && (
              <Island padding={1}>
                <ZoomActions
                  renderAction={actionManager.renderAction}
                  zoom={appState.zoom}
                />
              </Island>
            )}
            {!appState.viewModeEnabled && (
              <>
                <UndoRedoActions
                  renderAction={actionManager.renderAction}
                  className={clsx("zen-mode-transition", {
                    "layer-ui__wrapper__footer-left--transition-bottom":
                      appState.zenModeEnabled,
                  })}
                />

                <div
                  className={clsx("eraser-buttons zen-mode-transition", {
                    "layer-ui__wrapper__footer-left--transition-left":
                      appState.zenModeEnabled,
                  })}
                >
                  {actionManager.renderAction("eraser", { size: "small" })}
                </div>
              </>
            )}

            {showFinalize && (
              <FinalizeAction
                renderAction={actionManager.renderAction}
                className={clsx("zen-mode-transition", {
                  "layer-ui__wrapper__footer-left--transition-left":
                    appState.zenModeEnabled,
                })}
              />
            )}
            {appState.currentPageId && !device.isMobile && (
              <PageAwarenessDesktop
                pages={scene.getPageIds()}
                currentPageId={appState.currentPageId}
                onNextPage={() => actionManager.executeAction(actionNextPage)}
                onPrevPage={() => actionManager.executeAction(actionPrevPage)}
                onAddPage={() => actionManager.executeAction(actionAddPage)}
                onDeletePage={() =>
                  actionManager.executeAction(actionDeletePage)
                }
                isViewMode={appState.viewModeEnabled}
              />
            )}
          </Section>
        </Stack.Col>
      </div>
      <div
        className={clsx(
          "layer-ui__wrapper__footer-center zen-mode-transition",
          {
            "layer-ui__wrapper__footer-left--transition-bottom":
              appState.zenModeEnabled,
          },
        )}
      >
        {renderCustomFooter?.(false, appState)}
      </div>
      <div
        className={clsx("layer-ui__wrapper__footer-right zen-mode-transition", {
          "transition-right disable-pointerEvents": appState.zenModeEnabled,
        })}
      >
        {actionManager.renderAction("toggleShortcuts")}
      </div>
      <ExitZenModeAction
        actionManager={actionManager}
        showExitZenModeBtn={showExitZenModeBtn}
      />
    </footer>
  );
};

export default Footer;
