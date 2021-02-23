import React from "react";
import _ from "lodash";
import { Search } from "@material-ui/icons";

import { useBooleanState } from "../../hooks/use-boolean";
import i18n from "../../utils/i18n";
import {
    removeOverlayItem,
    SelectionState,
    setOverlayItemVisibility,
    setMainItemVisibility,
} from "../../view-models/SelectionState";
import { Dropdown, DropdownProps } from "../dropdown/Dropdown";
import { ModelSearch } from "../model-search/ModelSearch";

import "./ViewerSelector.css";
import { SelectionItem } from "./SelectionItem";
import { useUpdateActions } from "../../hooks/use-update-actions";

interface ViewerSelectorProps {
    selection: SelectionState;
    onSelectionChange(newSelection: SelectionState): void;
}

const actions = { setOverlayItemVisibility, removeOverlayItem, setMainItemVisibility };

export const ViewerSelector: React.FC<ViewerSelectorProps> = props => {
    const { selection, onSelectionChange } = props;

    const chainItems: DropdownProps["items"] = [
        { id: "A", text: "Chain A" },
        { id: "B", text: "Chain B" },
    ];

    const ligandItems: DropdownProps["items"] = [
        { id: "L1", text: "Ligand 1" },
        { id: "L2", text: "Ligand 2" },
    ];

    const [isSearchOpen, { enable: openSearch, disable: closeSearch }] = useBooleanState(true);

    const update = useUpdateActions(onSelectionChange, actions);

    return (
        <div id="viewer-selector">
            <div className="db">
                <div className="status">
                    {selection.main && (
                        <MainItemBox label={i18n.t("PDB")}>
                            <SelectionItem
                                selection={selection}
                                item={selection.main.pdb}
                                onVisibilityChange={update.setMainItemVisibility}
                            />
                        </MainItemBox>
                    )}

                    {selection.main && selection.main.emdb && (
                        <MainItemBox label={i18n.t("EMDB")}>
                            <SelectionItem
                                selection={selection}
                                item={selection.main.emdb}
                                onVisibilityChange={update.setMainItemVisibility}
                            />
                        </MainItemBox>
                    )}

                    <button onClick={openSearch}>
                        <Search /> {i18n.t("Search")}
                    </button>

                    {isSearchOpen && (
                        <ModelSearch
                            title={i18n.t("Select or append a new model")}
                            onClose={closeSearch}
                        />
                    )}
                </div>

                <div className="selection">
                    {selection.overlay.map(item => (
                        <SelectionItem
                            key={item.id}
                            selection={selection}
                            item={item}
                            onVisibilityChange={update.setOverlayItemVisibility}
                            onRemove={update.removeOverlayItem}
                        />
                    ))}
                </div>
            </div>

            <div className="selectors">
                <Dropdown
                    text={i18n.t("Chains")}
                    items={chainItems}
                    onClick={console.debug}
                    showExpandIcon
                />

                <Dropdown
                    text={i18n.t("Ligands")}
                    items={ligandItems}
                    onClick={console.debug}
                    showExpandIcon
                />
            </div>
        </div>
    );
};

const MainItemBox: React.FC<{ label: string }> = props => {
    const { label, children } = props;

    return (
        <div className="db-item">
            <div className="label">{label}</div>
            <div className="content">{children}</div>
        </div>
    );
};
