import clsx from "clsx";
import React from "react";
import { ActionManager } from "../actions/manager";
import { LIBRARY_SIDEBAR_WIDTH } from "../constants";
import { exportCanvas } from "../data";
import {
  isFixedSizePage,
  isTextElement,
  showSelectedShapeActions,
} from "../element";
import { NonDeletedExcalidrawElement } from "../element/types";
import { Language, t } from "../i18n";
import { calculateScrollCenter } from "../scene";
import { ExportType } from "../scene/types";
import { AppProps, AppState, ExcalidrawProps, BinaryFiles } from "../types";
import { muteFSAbortError } from "../utils";
import {
  SelectedShapeActions,
  SelectedShapeActionsCompact,
  ShapesSwitcher,
} from "./Actions";
import { BackgroundPickerAndDarkModeToggle } from "./BackgroundPickerAndDarkModeToggle";
import CollabButton from "./CollabButton";
import { ErrorDialog } from "./ErrorDialog";
import { ExportCB, ImageExportDialog } from "./ImageExportDialog";
import { FixedSideContainer } from "./FixedSideContainer";
import { HintViewer } from "./HintViewer";
import { Island } from "./Island";
import { LoadingMessage } from "./LoadingMessage";
import { LockButton } from "./LockButton";
import { MobileMenu } from "./MobileMenu";
import { AlternativeMobileMenu } from "./AlternativeMobileMenu";
import { PasteChartDialog } from "./PasteChartDialog";
import { Section } from "./Section";
import { HelpDialog } from "./HelpDialog";
import Stack from "./Stack";
import { UserList } from "./UserList";
import Library from "../data/library";
import { JSONExportDialog } from "./JSONExportDialog";
import { LibraryButton } from "./LibraryButton";
import { isImageFileHandle } from "../data/blob";
import { LibraryMenu } from "./LibraryMenu";

import "./LayerUI.scss";
import "./Toolbar.scss";
import { PenModeButton } from "./PenModeButton";
import { trackEvent } from "../analytics";
import { useDevice } from "../components/App";
import { Stats } from "./Stats";
import { actionToggleStats } from "../actions/actionToggleStats";
import Footer from "./Footer";
import { hostSidebarCountersAtom } from "./Sidebar/Sidebar";
import { jotaiScope } from "../jotai";
import { useAtom } from "jotai";
import Scene from "../scene/Scene";
import { PageAwarenessMobile } from "./PageAwareness";

interface LayerUIProps {
  actionManager: ActionManager;
  appState: AppState;
  files: BinaryFiles;
  canvas: HTMLCanvasElement | null;
  setAppState: React.Component<any, AppState>["setState"];
  elements: readonly NonDeletedExcalidrawElement[];
  onCollabButtonClick?: () => void;
  onLockToggle: () => void;
  onPenModeToggle: () => void;
  onInsertElements: (elements: readonly NonDeletedExcalidrawElement[]) => void;
  showExitZenModeBtn: boolean;
  langCode: Language["code"];
  isCollaborating: boolean;
  renderTopRightUI?: ExcalidrawProps["renderTopRightUI"];
  renderCustomFooter?: ExcalidrawProps["renderFooter"];
  renderCustomStats?: ExcalidrawProps["renderCustomStats"];
  renderCustomSidebar?: ExcalidrawProps["renderSidebar"];
  libraryReturnUrl: ExcalidrawProps["libraryReturnUrl"];
  UIOptions: AppProps["UIOptions"];
  focusContainer: () => void;
  library: Library;
  id: string;
  onImageAction: (data: { insertOnCanvasDirectly: boolean }) => void;
  alternativeMobileUI?: boolean;
  scene: Scene;
}
const LayerUI = ({
  actionManager,
  appState,
  files,
  setAppState,
  elements,
  canvas,
  onCollabButtonClick,
  onLockToggle,
  onPenModeToggle,
  onInsertElements,
  showExitZenModeBtn,
  isCollaborating,
  renderTopRightUI,
  renderCustomFooter,
  renderCustomStats,
  renderCustomSidebar,
  libraryReturnUrl,
  UIOptions,
  focusContainer,
  library,
  id,
  onImageAction,
  alternativeMobileUI,
  scene,
}: LayerUIProps) => {
  const device = useDevice();
  const currentPage = scene.getCurrentPageElement();

  const renderJSONExportDialog = () => {
    if (!UIOptions.canvasActions.export) {
      return null;
    }

    return (
      <JSONExportDialog
        elements={elements}
        appState={appState}
        files={files}
        actionManager={actionManager}
        exportOpts={UIOptions.canvasActions.export}
        canvas={canvas}
      />
    );
  };

  const renderImageExportDialog = () => {
    if (!UIOptions.canvasActions.saveAsImage) {
      return null;
    }

    const createExporter =
      (type: ExportType): ExportCB =>
      async (exportedElements) => {
        trackEvent("export", type, "ui");
        const fileHandle = await exportCanvas(
          type,
          exportedElements,
          scene.getCurrentPageElement(),
          appState,
          files,
          {
            exportBackground: appState.exportBackground,
            name: appState.name,
            viewBackgroundColor: appState.viewBackgroundColor,
          },
        )
          .catch(muteFSAbortError)
          .catch((error) => {
            console.error(error);
            setAppState({ errorMessage: error.message });
          });

        if (
          appState.exportEmbedScene &&
          fileHandle &&
          isImageFileHandle(fileHandle)
        ) {
          setAppState({ fileHandle });
        }
      };

    return (
      <ImageExportDialog
        elements={elements}
        page={scene.getCurrentPageElement()}
        appState={appState}
        files={files}
        actionManager={actionManager}
        onExportToPng={createExporter("png")}
        onExportToSvg={createExporter("svg")}
        onExportToClipboard={createExporter("clipboard")}
        exportPadding={
          currentPage && isFixedSizePage(currentPage) ? 0 : undefined
        }
      />
    );
  };

  const Separator = () => {
    return <div style={{ width: ".625em" }} />;
  };

  const renderViewModeCanvasActions = () => {
    return (
      <Section
        heading="canvasActions"
        className={clsx("zen-mode-transition", {
          "transition-left": appState.zenModeEnabled,
        })}
      >
        {/* the zIndex ensures this menu has higher stacking order,
         see https://github.com/excalidraw/excalidraw/pull/1445 */}
        <Island padding={2} style={{ zIndex: 1 }}>
          <Stack.Col gap={4}>
            <Stack.Row gap={1} justifyContent="space-between">
              {renderJSONExportDialog()}
              {renderImageExportDialog()}
            </Stack.Row>
          </Stack.Col>
        </Island>
      </Section>
    );
  };

  const CanvasActionsStackChild = alternativeMobileUI ? Stack.Col : Stack.Row;

  const renderCanvasActions = () => (
    <Section
      heading="canvasActions"
      className={clsx("zen-mode-transition", {
        "transition-left": appState.zenModeEnabled,
        "alt-mobile-compact": alternativeMobileUI,
      })}
    >
      {/* the zIndex ensures this menu has higher stacking order,
         see https://github.com/excalidraw/excalidraw/pull/1445 */}
      <Island padding={2} style={{ zIndex: 1 }}>
        <Stack.Col gap={4}>
          <CanvasActionsStackChild gap={1} justifyContent="space-between">
            {/* {actionManager.renderAction("clearCanvas")} */}
            {actionManager.renderAction("loadScene")}
            <Separator />
            {renderJSONExportDialog()}
            {renderImageExportDialog()}
            <Separator />
            {onCollabButtonClick && !UIOptions.disableCollaboration && (
              <CollabButton
                isCollaborating={isCollaborating}
                collaboratorCount={appState.collaborators.size}
                onClick={onCollabButtonClick}
              />
            )}
          </CanvasActionsStackChild>
          <BackgroundPickerAndDarkModeToggle
            actionManager={actionManager}
            compact={alternativeMobileUI}
          />
          {appState.fileHandle && (
            <>{actionManager.renderAction("saveToActiveFile")}</>
          )}
        </Stack.Col>
      </Island>
    </Section>
  );

  const renderSelectedShapeActions = () => {
    const Comp = alternativeMobileUI
      ? SelectedShapeActionsCompact
      : SelectedShapeActions;
    return (
      <Comp
        appState={appState}
        elements={elements}
        renderAction={actionManager.renderAction}
        isMobile={device.isMobile}
      />
    );
  };

  const renderFixedSideContainer = () => {
    const shouldRenderSelectedShapeActions = showSelectedShapeActions(
      appState,
      elements,
    );

    return (
      <FixedSideContainer side="top">
        <div className="App-menu App-menu_top">
          <Stack.Col
            gap={alternativeMobileUI ? 0 : 4}
            className={clsx({
              "disable-pointerEvents": appState.zenModeEnabled,
            })}
          >
            {appState.viewModeEnabled
              ? renderViewModeCanvasActions()
              : renderCanvasActions()}
            {shouldRenderSelectedShapeActions && renderSelectedShapeActions()}
          </Stack.Col>
          {!appState.viewModeEnabled && (
            <Section heading="shapes">
              {(heading: React.ReactNode) => (
                <Stack.Col align="start" gap={alternativeMobileUI ? 0 : 4}>
                  <Stack.Row
                    gap={1}
                    className={clsx("App-toolbar-container", {
                      "zen-mode": appState.zenModeEnabled,
                    })}
                  >
                    {!UIOptions.disablePenModeButton && (
                      <PenModeButton
                        zenModeEnabled={appState.zenModeEnabled}
                        checked={appState.penMode}
                        onChange={onPenModeToggle}
                        title={t("toolBar.penMode")}
                        penDetected={appState.penDetected}
                      />
                    )}
                    {!UIOptions.disableLockButton && (
                      <LockButton
                        zenModeEnabled={appState.zenModeEnabled}
                        checked={appState.activeTool.locked}
                        onChange={() => onLockToggle()}
                        title={t("toolBar.lock")}
                      />
                    )}
                    <Island
                      padding={1}
                      className={clsx("App-toolbar", {
                        "zen-mode": appState.zenModeEnabled,
                      })}
                    >
                      <HintViewer
                        appState={appState}
                        elements={elements}
                        isMobile={device.isMobile}
                        device={device}
                        currentPage={currentPage}
                      />
                      {heading}
                      <Stack.Row gap={1}>
                        <ShapesSwitcher
                          appState={appState}
                          canvas={canvas}
                          activeTool={appState.activeTool}
                          setAppState={setAppState}
                          onImageAction={({ pointerType }) => {
                            onImageAction({
                              insertOnCanvasDirectly: pointerType !== "mouse",
                            });
                          }}
                        />
                      </Stack.Row>
                    </Island>
                    {!UIOptions.disableLibrary && (
                      <LibraryButton
                        appState={appState}
                        setAppState={setAppState}
                      />
                    )}
                  </Stack.Row>
                </Stack.Col>
              )}
            </Section>
          )}
          <div
            className={clsx(
              "layer-ui__wrapper__top-right zen-mode-transition",
              {
                "transition-right": appState.zenModeEnabled,
              },
            )}
          >
            <UserList
              collaborators={appState.collaborators}
              actionManager={actionManager}
            />
            {renderTopRightUI?.(device.isMobile, appState)}
          </div>
        </div>
      </FixedSideContainer>
    );
  };

  const renderSidebars = () => {
    return appState.openSidebar === "customSidebar" ? (
      renderCustomSidebar?.() || null
    ) : appState.openSidebar === "library" ? (
      <LibraryMenu
        appState={appState}
        onInsertElements={onInsertElements}
        libraryReturnUrl={libraryReturnUrl}
        focusContainer={focusContainer}
        library={library}
        id={id}
      />
    ) : null;
  };

  const [hostSidebarCounters] = useAtom(hostSidebarCountersAtom, jotaiScope);

  return (
    <>
      {appState.isLoading && <LoadingMessage delay={250} />}
      {appState.errorMessage && (
        <ErrorDialog
          message={appState.errorMessage}
          onClose={() => setAppState({ errorMessage: null })}
        />
      )}
      {appState.showHelpDialog && (
        <HelpDialog
          onClose={() => {
            setAppState({ showHelpDialog: false });
          }}
        />
      )}
      {appState.pasteDialog.shown && (
        <PasteChartDialog
          setAppState={setAppState}
          appState={appState}
          onInsertChart={onInsertElements}
          onClose={() =>
            setAppState({
              pasteDialog: { shown: false, data: null },
            })
          }
        />
      )}
      {device.isMobile && appState.currentPageId && (
        <PageAwarenessMobile
          currentPageId={appState.currentPageId}
          pages={scene.getPageIds()}
        />
      )}
      {device.isMobile && alternativeMobileUI && (
        <AlternativeMobileMenu
          appState={appState}
          elements={elements}
          actionManager={actionManager}
          renderJSONExportDialog={renderJSONExportDialog}
          renderImageExportDialog={renderImageExportDialog}
          setAppState={setAppState}
          onCollabButtonClick={onCollabButtonClick}
          onLockToggle={() => onLockToggle()}
          onPenModeToggle={onPenModeToggle}
          canvas={canvas}
          isCollaborating={isCollaborating}
          renderCustomFooter={renderCustomFooter}
          onImageAction={onImageAction}
          renderTopRightUI={renderTopRightUI}
          renderCustomStats={renderCustomStats}
          UIOptions={UIOptions}
        />
      )}
      {device.isMobile && !alternativeMobileUI && (
        <MobileMenu
          appState={appState}
          elements={elements}
          currentPage={currentPage}
          actionManager={actionManager}
          renderJSONExportDialog={renderJSONExportDialog}
          renderImageExportDialog={renderImageExportDialog}
          setAppState={setAppState}
          onCollabButtonClick={onCollabButtonClick}
          onLockToggle={() => onLockToggle()}
          onPenModeToggle={onPenModeToggle}
          canvas={canvas}
          isCollaborating={isCollaborating}
          renderCustomFooter={renderCustomFooter}
          onImageAction={onImageAction}
          renderTopRightUI={renderTopRightUI}
          renderCustomStats={renderCustomStats}
          renderSidebars={renderSidebars}
          device={device}
        />
      )}

      {!device.isMobile && (
        <>
          <div
            className={clsx("layer-ui__wrapper", {
              "disable-pointerEvents":
                appState.draggingElement ||
                appState.resizingElement ||
                (appState.editingElement &&
                  !isTextElement(appState.editingElement)),
            })}
            style={
              ((appState.openSidebar === "library" &&
                appState.isSidebarDocked) ||
                hostSidebarCounters.docked) &&
              device.canDeviceFitSidebar
                ? { width: `calc(100% - ${LIBRARY_SIDEBAR_WIDTH}px)` }
                : {}
            }
          >
            {renderFixedSideContainer()}
            <Footer
              appState={appState}
              actionManager={actionManager}
              renderCustomFooter={renderCustomFooter}
              showExitZenModeBtn={showExitZenModeBtn}
              scene={scene}
            />
            {appState.showStats && (
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
            {appState.scrolledOutside && (
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
          </div>
          {renderSidebars()}
        </>
      )}
    </>
  );
};

const areEqual = (prev: LayerUIProps, next: LayerUIProps) => {
  const getNecessaryObj = (appState: AppState): Partial<AppState> => {
    const {
      suggestedBindings,
      startBoundElement: boundElement,
      ...ret
    } = appState;
    return ret;
  };
  const prevAppState = getNecessaryObj(prev.appState);
  const nextAppState = getNecessaryObj(next.appState);

  const keys = Object.keys(prevAppState) as (keyof Partial<AppState>)[];

  return (
    prev.renderCustomFooter === next.renderCustomFooter &&
    prev.renderTopRightUI === next.renderTopRightUI &&
    prev.renderCustomStats === next.renderCustomStats &&
    prev.renderCustomSidebar === next.renderCustomSidebar &&
    prev.langCode === next.langCode &&
    prev.elements === next.elements &&
    prev.files === next.files &&
    keys.every((key) => prevAppState[key] === nextAppState[key])
  );
};

export default React.memo(LayerUI, areEqual);
