import { Selector } from "@3dbionotes/pdbe-molstar/lib";
import _ from "lodash";
import { Maybe } from "../../utils/ts-utils";

const innerSeparator = "+";
const mainSeparator = "|";

export type Type = "pdb" | "emdb";

export type ActionType = "select" | "append";

export interface Selection {
    main: { pdb?: DbItem; emdb?: DbItem };
    overlay: Array<DbItem>;
}

export interface DbItem {
    type: Type;
    id: string;
    visible: boolean;
}

export function getItemSelector(item: DbItem): Selector {
    switch (item.type) {
        case "pdb": // Example: label = "6w9c"
            return { label: new RegExp("^" + item.id.toUpperCase() + "$") };
        case "emdb": // Example: label = "RCSB PDB EMD Density Server: EMD-8650"
            return { label: new RegExp(item.id.toUpperCase() + "$") };
    }
}

/* toString, fromString */

export function getSelectionFromString(items: Maybe<string>): Selection {
    const [main = "", overlay = ""] = (items || "").split(mainSeparator, 2);
    const [mainPdbRichId, mainEmdbRichId] = main.split(innerSeparator, 2);
    const overlayIds = overlay.split(innerSeparator);

    const selection: Selection = {
        main: { pdb: buildDbItem(mainPdbRichId), emdb: buildDbItem(mainEmdbRichId) },
        overlay: _.compact(overlayIds.map(buildDbItem)),
    };

    return selection;
}

export function getStringFromSelection(selection: Selection): string {
    const { main, overlay } = selection;
    const mainParts = main ? [getItemParam(main.pdb), getItemParam(main.emdb)] : [];
    const parts = [mainParts.join(innerSeparator), overlay.map(getItemParam).join(innerSeparator)];
    return _.compact(parts).join(mainSeparator);
}

/* Updaters */

export function setMainPdb(selection: Selection, pdbId: Maybe<string>): Selection {
    if (!selection.main || selection.main?.pdb?.id === pdbId) return selection;

    return {
        ...selection,
        main: {
            ...selection.main,
            pdb: pdbId ? { type: "pdb", id: pdbId, visible: true } : undefined,
        },
    };
}

export function setMainEmdb(selection: Selection, emdbId: Maybe<string>): Selection {
    if (!selection.main || selection.main?.emdb?.id === emdbId) return selection;

    return {
        ...selection,
        main: {
            ...selection.main,
            emdb: emdbId ? { type: "emdb", id: emdbId, visible: true } : undefined,
        },
    };
}

export function removeOverlayItem(selection: Selection, id: string): Selection {
    const newOverlay = selection.overlay.map(item => (item.id === id ? null : item));
    return { ...selection, overlay: _.compact(newOverlay) };
}

export function setOverlayItemVisibility(
    selection: Selection,
    id: string,
    visible: boolean
): Selection {
    const newOverlay = selection.overlay.map(item =>
        item.id === id ? { ...item, visible } : item
    );
    return { ...selection, overlay: newOverlay };
}

export function setMainItemVisibility(
    selection: Selection,
    id: string,
    visible: boolean
): Selection {
    const { main } = selection;
    if (!main) return selection;
    const newMainPdb = main.pdb?.id === id ? { ...main.pdb, visible } : main.pdb;
    const newMainEmdb = main.emdb?.id === id ? { ...main.emdb, visible } : main.emdb;
    return { ...selection, main: { pdb: newMainPdb, emdb: newMainEmdb } };
}

function getId(item: DbItem) {
    return item.id;
}

export function diffDbItems(newItems: DbItem[], oldItems: DbItem[]) {
    const added = _.differenceBy(newItems, oldItems, getId);
    const removed = _.differenceBy(oldItems, newItems, getId);
    const commonIds = _.intersectionBy(oldItems, newItems, getId).map(getId);
    const oldItemsById = _.keyBy(oldItems, getId);
    const newItemsById = _.keyBy(newItems, getId);
    const updated = _(commonIds)
        .filter(id => !_.isEqual(oldItemsById[id], newItemsById[id]))
        .map(id => newItemsById[id])
        .compact()
        .value();

    return { added, removed, updated };
}

export function getItems(selection: Selection | undefined): DbItem[] {
    return selection
        ? _.concat(
              selection.main ? _.compact([selection.main.pdb, selection.main.emdb]) : [],
              selection.overlay
          )
        : [];
}

export function buildDbItem(richId: string | undefined): DbItem | undefined {
    if (!richId) return;

    const [visible, id] = richId[0] === "!" ? [false, richId.slice(1)] : [true, richId];

    let type: DbItem["type"];
    if (id.match(/^\d[\d\w]{3}$/)) {
        type = "pdb";
    } else if (id.match(/^EMD-\d+$/)) {
        type = "emdb";
    } else {
        return;
    }

    return { type, id, visible };
}

export function getItemParam(item: DbItem | undefined): string | undefined {
    return item ? [item.visible ? "" : "!", item.id].join("") : undefined;
}

export function runAction(selection: Selection, action: ActionType, item: DbItem): Selection {
    switch (action) {
        case "select": {
            const newMain: Selection["main"] =
                item.type === "pdb"
                    ? { ...selection.main, pdb: { type: "pdb", id: item.id, visible: true } }
                    : { ...selection.main, emdb: { type: "emdb", id: item.id, visible: true } };

            return { main: newMain, overlay: [] };
        }
        case "append": {
            const newOverlay: Selection["overlay"] = _.uniqBy(
                [...selection.overlay, { type: "pdb", id: item.id, visible: true }],
                getDbItemUid
            );

            return { ...selection, overlay: newOverlay };
        }
    }
}

function getDbItemUid(item: DbItem): string {
    return [item.type, item.id].join("-");
}
