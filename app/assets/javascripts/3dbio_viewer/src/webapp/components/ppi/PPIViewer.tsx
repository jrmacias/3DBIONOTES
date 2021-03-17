import React from "react";
import { Pdb } from "../../../domain/entities/Pdb";
import { routes } from "../../../routes";
import { SelectionState } from "../../view-models/SelectionState";
import { FrameViewer } from "../frame-viewer/FrameViewer";
import { TrackDef } from "../protvista/Protvista.types";

interface PPiViewerProps {
    trackDef: TrackDef;
    pdb: Pdb;
    selection: SelectionState;
}

export const PPIViewer: React.FC<PPiViewerProps> = props => {
    const { pdb, trackDef } = props;
    const src = routes.bionotes + `/ppiIFrame?pdb=${pdb.id}`;
    const title = `${trackDef.name}: ${trackDef.description || "-"}`;

    return <FrameViewer title={title} src={src} />;
};
