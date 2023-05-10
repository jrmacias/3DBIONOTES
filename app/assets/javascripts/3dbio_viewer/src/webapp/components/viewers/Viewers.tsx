import React from "react";
import i18n from "../../utils/i18n";
import { Loader, LoaderState } from "../Loader";
import { usePdbLoader } from "../../hooks/use-pdb";
import {
    Pdb,
    addCustomAnnotationsToPdb,
    addProteinNetworkToPdb,
} from "../../../domain/entities/Pdb";
import { PdbInfo } from "../../../domain/entities/PdbInfo";
import { ViewerState } from "../../view-models/ViewerState";
import { UploadData } from "../../../domain/entities/UploadData";
import { Maybe } from "../../../utils/ts-utils";
import { Annotations } from "../../../domain/entities/Annotation";
import { ProteinNetwork } from "../../../domain/entities/ProteinNetwork";
import { PdbViewer } from "./PdbViewer";
import { goToElement } from "../protvista/JumpToButton";

export interface ViewersProps {
    viewerState: ViewerState;
    pdbInfo: Maybe<PdbInfo>;
    uploadData: Maybe<UploadData>;
    proteinNetwork: Maybe<ProteinNetwork>;
    pdbLoader: LoaderState<Pdb>;
    setPdbLoader: React.Dispatch<React.SetStateAction<LoaderState<Pdb>>>;
}

export const Viewers: React.FC<ViewersProps> = React.memo(props => {
    const { viewerState, pdbInfo, uploadData, proteinNetwork, pdbLoader, setPdbLoader } = props;

    const onAddAnnotations = React.useCallback(
        (annotations: Annotations) => {
            setPdbLoader(pdbLoader => {
                if (pdbLoader.type === "loaded") {
                    const newPdb = addCustomAnnotationsToPdb(pdbLoader.data, annotations);
                    return { type: "loaded", data: newPdb };
                } else {
                    return pdbLoader;
                }
            });
        },
        [setPdbLoader]
    );

    // Add custom annotations from uploadData
    React.useEffect(() => {
        if (pdbLoader.type !== "loaded") return;

        setPdbLoader(pdbLoader => {
            if (pdbLoader.type === "loaded" && uploadData) {
                const newPdb = addCustomAnnotationsToPdb(pdbLoader.data, uploadData.annotations);
                return { type: "loaded", data: newPdb };
            } else {
                return pdbLoader;
            }
        });
    }, [uploadData, setPdbLoader, pdbLoader?.type]);

    // Add data from protein network
    React.useEffect(() => {
        if (pdbLoader.type !== "loaded") return;

        setPdbLoader(pdbLoader => {
            if (pdbLoader.type === "loaded") {
                if (proteinNetwork) goToElement("proteinInteraction");
                const newPdb = addProteinNetworkToPdb(pdbLoader.data, proteinNetwork);
                return { type: "loaded", data: newPdb };
            } else {
                return pdbLoader;
            }
        });
    }, [proteinNetwork, setPdbLoader, pdbLoader.type]);

    return (
        <React.Fragment>
            <Loader state={pdbLoader} />

            {pdbLoader.type === "loaded" && pdbInfo && (
                <PdbViewer
                    pdbInfo={pdbInfo}
                    pdb={pdbLoader.data}
                    viewerState={viewerState}
                    onAddAnnotations={onAddAnnotations}
                />
            )}
        </React.Fragment>
    );
});
