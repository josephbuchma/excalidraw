import { ToolButton } from "../components/ToolButton";
import { t } from "../i18n";
import { newPageElement } from "../element/newElement";
import {
  addPage,
  deletePage,
  hasPageBefore,
  hasPageAfter,
  hasSingleEmptyPage,
} from "../element";
import { register } from "./register";

export const actionAddPage = register({
  name: "addPage",
  isCrossPageAction: true,
  trackEvent: { category: "toolbar" },
  contextItemPredicate: (elements, appState) => {
    return appState.documentMode === "multi-page";
  },
  perform: (elements, appState, forData, app) => {
    const { currentPageId } = appState;
    if (!currentPageId) {
      console.error("can't add page when currentPageId is null");
      return { commitToHistory: false };
    }
    const newPage = newPageElement();
    const updatedElements = addPage(newPage, currentPageId, elements);
    return {
      commitToHistory: true,
      appState: { ...appState, currentPageId: newPage.id },
      elements: updatedElements,
    };
  },
  // keyTest: (event) =>
  //   event[KEYS.CTRL_OR_CMD] &&
  //   event.key.toLowerCase() === KEYS.Z &&
  //   !event.shiftKey,
  PanelComponent: ({ updateData, data, appState, elements }) => (
    <ToolButton
      type="button"
      visible={appState.documentMode === "multi-page"}
      icon={"+"}
      aria-label={t("buttons.undo")}
      onClick={updateData}
      size={data?.size || "medium"}
    />
  ),
});

export const actionDeletePage = register({
  name: "deletePage",
  isCrossPageAction: true,
  trackEvent: { category: "toolbar" },
  perform: (elements, appState, forData, app) => {
    const { currentPageId } = appState;
    if (!currentPageId) {
      console.error("can't add page when currentPageId is null");
      return { commitToHistory: false };
    }
    const adjPageId =
      app.scene.getPrevPageId() === appState.currentPageId
        ? app.scene.getNextPageId()
        : app.scene.getPrevPageId();
    const updatedElements = deletePage(
      currentPageId,
      elements,
      !adjPageId || adjPageId === appState.currentPageId,
    );
    return {
      commitToHistory: true,
      appState: { ...appState, currentPageId: adjPageId },
      elements: updatedElements,
    };
  },
  // keyTest: (event) =>
  //   event[KEYS.CTRL_OR_CMD] &&
  //   event.key.toLowerCase() === KEYS.Z &&
  //   !event.shiftKey,
  PanelComponent: ({ updateData, data, appState, elements }) => (
    <ToolButton
      type="button"
      visible={
        appState.documentMode === "multi-page" && !hasSingleEmptyPage(elements)
      }
      icon={"x"}
      aria-label={t("buttons.undo")}
      onClick={updateData}
      size={data?.size || "medium"}
    />
  ),
});

export const actionPrevPage = register({
  name: "prevPage",
  isCrossPageAction: true,
  trackEvent: { category: "canvas" },
  perform: (elements, appState, formData, app) => {
    return {
      commitToHistory: false,
      appState: { ...appState, currentPageId: app.scene.getPrevPageId() },
    };
  },
  // keyTest: (event) =>
  //   event[KEYS.CTRL_OR_CMD] &&
  //   event.key.toLowerCase() === KEYS.Z &&
  //   !event.shiftKey,
  PanelComponent: ({ updateData, data, appState, elements }) => (
    <ToolButton
      type="button"
      visible={Boolean(
        appState.documentMode === "multi-page" &&
          appState.currentPageId &&
          hasPageBefore(appState.currentPageId, elements),
      )}
      icon={"<"}
      aria-label={t("buttons.undo")}
      onClick={updateData}
      size={data?.size || "medium"}
    />
  ),
});

export const actionNextPage = register({
  name: "nextPage",
  isCrossPageAction: true,
  trackEvent: { category: "canvas" },
  perform: (elements, appState, forData, app) => {
    return {
      commitToHistory: false,
      appState: { ...appState, currentPageId: app.scene.getNextPageId() },
    };
  },
  // keyTest: (event) =>
  //   (event[KEYS.CTRL_OR_CMD] &&
  //     event.shiftKey &&
  //     event.key.toLowerCase() === KEYS.Z) ||
  //   (isWindows && event.ctrlKey && !event.shiftKey && event.key === KEYS.Y),
  PanelComponent: ({ updateData, data, appState, elements }) => (
    <ToolButton
      type="button"
      visible={
        appState.documentMode === "multi-page" &&
        !!appState.currentPageId &&
        hasPageAfter(appState.currentPageId, elements)
      }
      icon={">"}
      aria-label={t("buttons.redo")}
      onClick={updateData}
      size={data?.size || "medium"}
    />
  ),
});
