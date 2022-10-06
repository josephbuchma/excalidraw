import {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
  NonDeleted,
  ExcalidrawPageElements,
} from "./types";
import { isInvisiblySmallElement } from "./sizeHelpers";
import { isLinearElementType } from "./typeChecks";

export {
  newElement,
  newTextElement,
  updateTextElement,
  newLinearElement,
  newImageElement,
  duplicateElement,
} from "./newElement";
export {
  getElementAbsoluteCoords,
  getElementBounds,
  getCommonBounds,
  getDiamondPoints,
  getArrowheadPoints,
  getClosestElementBounds,
} from "./bounds";

export {
  OMIT_SIDES_FOR_MULTIPLE_ELEMENTS,
  getTransformHandlesFromCoords,
  getTransformHandles,
} from "./transformHandles";
export {
  hitTest,
  isHittingElementBoundingBoxWithoutHittingElement,
} from "./collision";
export {
  resizeTest,
  getCursorForResizingElement,
  getElementWithTransformHandleType,
  getTransformHandleTypeFromCoords,
} from "./resizeTest";
export {
  transformElements,
  getResizeOffsetXY,
  getResizeArrowDirection,
} from "./resizeElements";
export {
  dragSelectedElements,
  getDragOffsetXY,
  dragNewElement,
} from "./dragElements";
export { isTextElement, isExcalidrawElement } from "./typeChecks";
export { textWysiwyg } from "./textWysiwyg";
export { redrawTextBoundingBox } from "./textElement";
export {
  getPerfectElementSize,
  getLockedLinearCursorAlignSize,
  isInvisiblySmallElement,
  resizePerfectLineForNWHandler,
  getNormalizedDimensions,
} from "./sizeHelpers";
export { showSelectedShapeActions } from "./showSelectedShapeActions";

export const getSceneVersion = (elements: readonly ExcalidrawElement[]) =>
  elements.reduce((acc, el) => acc + el.version, 0);

export const getVisibleElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(
    (el) => !el.isDeleted && !isInvisiblySmallElement(el),
  ) as readonly NonDeletedExcalidrawElement[];

export const getNonDeletedElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(
    (element) => !element.isDeleted,
  ) as readonly NonDeletedExcalidrawElement[];

export const getElementsOnPage = (
  pageId: string | null,
  elements: readonly ExcalidrawElement[],
): ExcalidrawPageElements => {
  let pageElIdx: number = -1;
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (pageElIdx < 0 && el.type === "page" && el.id === pageId) {
      pageElIdx = i;
      continue;
    }
    if (pageElIdx > -1 && el.type === "page") {
      return elements.slice(pageElIdx + 1, i) as ExcalidrawPageElements;
    }
  }
  return elements.slice(pageElIdx + 1) as ExcalidrawPageElements;
};

export const replaceElementsOnPage = (
  pageId: string | null,
  newElements: ExcalidrawPageElements,
  allElements: readonly ExcalidrawElement[],
) => {
  let start: number = -1;
  const ret = [];
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    if (start < 0) {
      ret.push(el);
    }
    if (start < 0 && el.type === "page" && el.id === pageId) {
      start = i;
      ret.push(...newElements);
      continue;
    }
    if (start > -1 && el.type === "page") {
      ret.push(...allElements.slice(i));
      return ret;
    }
  }
  return ret;
};

export const isNonDeletedElement = <T extends ExcalidrawElement>(
  element: T,
): element is NonDeleted<T> => !element.isDeleted;

const _clearElements = (
  elements: readonly ExcalidrawElement[],
): ExcalidrawElement[] =>
  getNonDeletedElements(elements).map((element) =>
    isLinearElementType(element.type)
      ? { ...element, lastCommittedPoint: null }
      : element,
  );

export const clearElementsForDatabase = (
  elements: readonly ExcalidrawElement[],
) => _clearElements(elements);

export const clearElementsForExport = (
  elements: readonly ExcalidrawElement[],
) => _clearElements(elements);

export const clearElementsForLocalStorage = (
  elements: readonly ExcalidrawElement[],
) => _clearElements(elements);
