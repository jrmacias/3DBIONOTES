import React from "react";
import { getEntityLink, Pdb } from "../../domain/entities/Pdb";
import i18n from "../utils/i18n";
import { SelectionState } from "../view-models/SelectionState";
import { LinkFromObj } from "./Link";

export interface BasicInfoProps {
    pdb: Pdb;
    selection: SelectionState;
}

interface Item {
    name: string;
    value: React.ReactNode;
    isDisabled?: boolean;
    help?: string;
}

export const BasicInfoViewer: React.FC<BasicInfoProps> = React.memo(props => {
    const { pdb } = props;
    const items: Item[] = getItems(pdb);

    return (
        <Parent>
            {items
                .filter(item => !item.isDisabled)
                .map(item => (
                    <Child key={item.name} name={item.name} value={item.value} help={item.help} />
                ))}
        </Parent>
    );
});

const Parent: React.FC = ({ children }) => {
    return <ul>{children}</ul>;
};

interface ChildProps {
    name: string;
    value: React.ReactNode;
    help?: string;
}

const Child: React.FC<ChildProps> = props => {
    const { name, value, help } = props;

    return (
        <ul>
            {name}: {value ?? "-"}
            {help && (
                <span style={styles.help} title={help}>
                    [?]
                </span>
            )}
        </ul>
    );
};

const styles = {
    help: { marginLeft: 10 },
};

function getItems(pdb: Pdb) {
    const resolution = pdb.experiment?.resolution;

    const items: Item[] = [
        { name: i18n.t("Protein Name"), value: pdb.protein.name },
        { name: i18n.t("Gene Name"), value: pdb.protein.gene },
        { name: i18n.t("Organism"), value: pdb.protein.organism },
        {
            name: i18n.t("Biological function"),
            isDisabled: true,
            value: "TODO",
            help: i18n.t(
                "Go annotations (ontology) about molecular function or using a description given by Uniprot (Link to Uniprot/Enzyme expasy (in the case of enzymes))"
            ),
        },
        { name: i18n.t("Obtaining method"), value: pdb.experiment?.method },
        {
            name: i18n.t("Uniprot ID"),
            value: <LinkFromObj link={getEntityLink(pdb, "uniprot")} />,
        },
        {
            name: i18n.t("PDB ID"),
            value: <LinkFromObj link={getEntityLink(pdb, "pdb")} />,
        },
        {
            name: i18n.t("EMDB ID"),
            value: <LinkFromObj link={getEntityLink(pdb, "emdb")} emptyValue="-" />,
            help: i18n.t("Do you want to load the associated map with this protein structure?"),
        },
        {
            name: i18n.t("Resolution"),
            value: resolution ? `${resolution.toString()} Å` : undefined,
            help: i18n.t(
                "This determines the possible use given to the structure of the protein (Å). Depending on the global resolution range and the local resolution of the relevant sites, we can introduce the possible uses depending on the tables that are usually used (ex. https://science.sciencemag.org/content/294/5540/93)"
            ),
        },
    ];

    return items;
}
