import {
  ExcalidrawElement,
  NonDeleted,
  ExcalidrawPageElements,
  ExcalidrawDocumentElements,
  NonDeletedExcalidrawDocumentElements,
} from "../element/types";
import {
  getNonDeletedElements,
  getElementsOnPage,
  isNonDeletedElement,
  replaceElementsOnPage,
} from "../element";
import { LinearElementEditor } from "../element/linearElementEditor";
import { last } from "lodash";
import _ from "lodash";

type ElementIdKey = InstanceType<typeof LinearElementEditor>["elementId"];
type ElementKey = ExcalidrawElement | ElementIdKey;

type SceneStateCallback = () => void;
type SceneStateCallbackRemover = () => void;

const isIdKey = (elementKey: ElementKey): elementKey is ElementIdKey => {
  if (typeof elementKey === "string") {
    return true;
  }
  return false;
};

class Scene {
  // ---------------------------------------------------------------------------
  // static methods/props
  // ---------------------------------------------------------------------------

  private static sceneMapByElement = new WeakMap<ExcalidrawElement, Scene>();
  private static sceneMapById = new Map<string, Scene>();

  static mapElementToScene(elementKey: ElementKey, scene: Scene) {
    if (isIdKey(elementKey)) {
      // for cases where we don't have access to the element object
      // (e.g. restore serialized appState with id references)
      this.sceneMapById.set(elementKey, scene);
    } else {
      this.sceneMapByElement.set(elementKey, scene);
      // if mapping element objects, also cache the id string when later
      // looking up by id alone
      this.sceneMapById.set(elementKey.id, scene);
    }
  }

  static getScene(elementKey: ElementKey): Scene | null {
    if (isIdKey(elementKey)) {
      return this.sceneMapById.get(elementKey) || null;
    }
    return this.sceneMapByElement.get(elementKey) || null;
  }

  // ---------------------------------------------------------------------------
  // instance methods/props
  // ---------------------------------------------------------------------------

  private currentPageId: () => string | null = () => null;
  private callbacks: Set<SceneStateCallback> = new Set();

  private nonDeletedElements: NonDeletedExcalidrawDocumentElements = [];
  private elements: ExcalidrawDocumentElements = [];
  private elementsMap = new Map<ExcalidrawElement["id"], ExcalidrawElement>();
  private pages: readonly string[] = [];

  getElementsIncludingDeleted(): ExcalidrawPageElements {
    return getElementsOnPage(this.currentPageId(), this.elements);
  }

  getDocumentElementsIncludingDeleted(): ExcalidrawDocumentElements {
    return this.elements;
  }

  getNonDeletedElements(): NonDeletedExcalidrawDocumentElements {
    return getElementsOnPage(this.currentPageId(), this.nonDeletedElements);
  }

  getNonDeletedDocumentElements(): NonDeletedExcalidrawDocumentElements {
    return this.nonDeletedElements as NonDeletedExcalidrawDocumentElements;
  }

  getElement<T extends ExcalidrawElement>(id: T["id"]): T | null {
    return (this.elementsMap.get(id) as T | undefined) || null;
  }

  getNonDeletedElement(
    id: ExcalidrawElement["id"],
  ): NonDeleted<ExcalidrawElement> | null {
    const element = this.getElement(id);
    if (element && isNonDeletedElement(element)) {
      return element;
    }
    return null;
  }

  replaceAllDocumentElements(nextElements: ExcalidrawDocumentElements) {
    this._replaceAllElements(nextElements, { allPages: true });
  }

  replaceAllElements(nextElements: ExcalidrawPageElements) {
    this._replaceAllElements(nextElements, { allPages: false });
  }

  private _replaceAllElements(
    nextElements: ExcalidrawDocumentElements,
    opts = { allPages: false },
  ) {
    const pageId = this.currentPageId();

    if (!pageId || opts.allPages) {
      console.log("Replacing all elements");
      this.elements = nextElements;
    } else {
      console.log("Replacing elements on page", pageId, nextElements);
      this.elements = replaceElementsOnPage(
        pageId,
        nextElements as ExcalidrawPageElements,
        this.elements,
      );
    }

    this.pages = this.elements.reduce((acc, el) => {
      return el.type === "page" &&
        !el.isDeleted &&
        acc[acc.length - 1] !== el.id
        ? [...acc, el.id]
        : acc;
    }, [] as readonly string[]);
    this.elementsMap.clear();
    this.elements.forEach((element) => {
      this.elementsMap.set(element.id, element);
      Scene.mapElementToScene(element, this);
    });
    this.nonDeletedElements = getNonDeletedElements(this.elements);
    this.informMutation();
    const ids = this.elements;
    if (_.uniq(ids.map((el) => el.id)).length !== ids.length) {
      console.warn(
        "Scene.elements got some duplicated elements:",
        this.elements,
      );
    }
  }

  informMutation() {
    for (const callback of Array.from(this.callbacks)) {
      callback();
    }
  }

  setCurrentPageIdGetter(getCurrentPageId: () => string | null) {
    this.currentPageId = getCurrentPageId;
  }

  getNextPageId(): string | null {
    if (last(this.pages) === this.currentPageId()) {
      return this.currentPageId();
    }
    return (
      this.pages[this.pages.indexOf(this.currentPageId()!) + 1] ||
      this.currentPageId()
    );
  }

  getPrevPageId(): string | null {
    if (this.currentPageId() === this.elements[0]?.pageId) {
      return this.currentPageId();
    }
    return (
      this.pages[this.pages.indexOf(this.currentPageId()!) - 1] ||
      this.currentPageId()
    );
  }

  addCallback(cb: SceneStateCallback): SceneStateCallbackRemover {
    if (this.callbacks.has(cb)) {
      throw new Error();
    }

    this.callbacks.add(cb);

    return () => {
      if (!this.callbacks.has(cb)) {
        throw new Error();
      }
      this.callbacks.delete(cb);
    };
  }

  destroy() {
    Scene.sceneMapById.forEach((scene, elementKey) => {
      if (scene === this) {
        Scene.sceneMapById.delete(elementKey);
      }
    });
    // done not for memory leaks, but to guard against possible late fires
    // (I guess?)
    this.callbacks.clear();
  }
}

export default Scene;
