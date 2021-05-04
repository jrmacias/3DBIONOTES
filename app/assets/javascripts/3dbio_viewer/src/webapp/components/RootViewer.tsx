import React from "react";
import { Viewers } from "./viewers/Viewers";
import { MolecularStructure } from "./molecular-structure/MolecularStructure";
import { ViewerSelector } from "./viewer-selector/ViewerSelector";
import { useViewerState } from "./viewer-selector/viewer-selector.hooks";
import { usePdbInfo } from "../hooks/loader-hooks";

export const RootViewer: React.FC = React.memo(() => {
    const [viewerState, { setSelection }] = useViewerState();
    const { selection } = viewerState;
    const pdbInfo = usePdbInfo(selection);

    return (
        <div id="viewer">
            <ViewerSelector
                pdbInfo={pdbInfo}
                selection={selection}
                onSelectionChange={setSelection}
            />

            <div id="left">
                <MolecularStructure selection={selection} onSelectionChange={setSelection} />
            </div>

            <div id="right">{pdbInfo && <Viewers pdbInfo={pdbInfo} selection={selection} />}</div>
        </div>
    );
});
