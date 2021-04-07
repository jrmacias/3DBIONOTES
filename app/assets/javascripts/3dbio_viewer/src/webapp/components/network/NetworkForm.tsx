import React, { useCallback, useState, useRef } from "react";
import i18n from "../../utils/i18n";
import { Dropzone, DropzoneRef } from "../dropzone/Dropzone";
import IncludeNeighborsCheckbox from "./IncludeNeighborsCheckbox";
import Label from "./Label";
import NetworkExample from "./NetworkExample";
import UniProtAccessionTextArea from "./UniProtAccessionTextArea";
import SpeciesSelect from "./SpeciesSelect";
import "./Network.css";

interface NetworkForm {
    species: string;
    uniProtAccession: string;
    includeNeighboursWithStructuralData: boolean;
}

const NetworkForm = React.memo(() => {
    const annotationFileRef = useRef<DropzoneRef>(null);
    const [error, setError] = useState<string>();
    const initialNetworkForm = {
        species: "homoSapiens",
        uniProtAccession: "",
        includeNeighboursWithStructuralData: false,
    };
    const [networkForm, setNetworkForm] = useState<NetworkForm>(initialNetworkForm);

    const addNetwork = useCallback(() => {
        setError("");
        if (networkForm.uniProtAccession === "") {
            setError(i18n.t("Error: Please write down the UniProt accession"));
        }
    }, [networkForm]);

    return (
        <div className="network-form">
            <Label forText={i18n.t("species")} label={i18n.t("Select species")} />
            <SpeciesSelect
                value={networkForm.species}
                onSpeciesChange={e =>
                    setNetworkForm({
                        ...networkForm,
                        species: e,
                    })
                }
            />
            <Label forText={i18n.t("uniProtAccession")} label={i18n.t("Enter a list of UniProt accession")} />
            <NetworkExample
                onExampleClick={e =>
                    setNetworkForm({
                        ...networkForm,
                        uniProtAccession: e,
                    })
                }
            />
            <UniProtAccessionTextArea
                value={networkForm.uniProtAccession}
                onChange={e => setNetworkForm({ ...networkForm, uniProtAccession: e })}
            />
            <IncludeNeighborsCheckbox
                checkedValue={networkForm.includeNeighboursWithStructuralData}
                onCheckboxChange={() =>
                    setNetworkForm({
                        ...networkForm,
                        includeNeighboursWithStructuralData: !networkForm.includeNeighboursWithStructuralData,
                    })
                }
            />

            <Label forText={i18n.t("uploadAnnotations")} label={i18n.t("Upload your annotations in JSON format")} />
            <Dropzone ref={annotationFileRef} accept="application/json"></Dropzone>
            {error && <h3>{error}</h3>}

            <button className="submit-button" type="submit" onClick={addNetwork}>
                {i18n.t("Submit")}
            </button>
        </div>
    );
});

export default NetworkForm;
