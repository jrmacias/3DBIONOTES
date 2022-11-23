import React from "react";
import { Pdb } from "../../../domain/entities/Pdb";
import { recordOfStyles } from "../../../utils/ts-utils";
import { Selection } from "../../view-models/Selection";
import { BlockDef } from "../protvista/Protvista.types";
import i18n from "../../utils/i18n";
import { ImageDataResource } from "../../../data/PdbLigands";
import _ from "lodash";
import styled from "styled-components";
import { Assay, Compound, Screen } from "../../../domain/entities/LigandImageData";
import { IconButton, Typography } from "@material-ui/core";
import { OpenInNew } from "@material-ui/icons";
import { ViewerTooltip } from "../viewer-tooltip/ViewerTooltip";

interface BasicInfoProps {
    pdb: Pdb;
}

export const IDRViewerBlock: React.FC<BasicInfoProps> = React.memo(props => {
    const { pdb } = props;
    const [showTooltip, setShowTooltip] = React.useState(false);

    const idrs = _.compact(pdb.ligands?.map(ligand => ligand.imageDataResource));

    return (
        <div style={styles.section}>
            <div style={styles.title}>
                {i18n.t("High-Content Screening (HCS) Assays")}
                <ViewerTooltip
                    title={i18n.t("Text to be determined.")}
                    showTooltip={showTooltip}
                    setShowTooltip={setShowTooltip}
                >
                    <button onClick={() => setShowTooltip(!showTooltip)}>?</button>
                </ViewerTooltip>
            </div>
            <p className="contents">{i18n.t("Text to be determined.")}</p>
            {idrs?.map((idr, i) => (
                <Container key={i}>
                    {idr.assays.map((assay, idx) => {
                        return (
                            <>
                                <Section title={i18n.t("Assay")}>
                                    <AssayFC key={idx} assay={assay} dataSource={idr.dataSource} />
                                </Section>
                                <Section title={i18n.t("Screens")}>
                                    {assay.screens.map((screen, idx) => (
                                        <ScreenFC key={idx} screen={screen} />
                                    ))}
                                </Section>
                                <Section title={i18n.t("Compound")}>
                                    <CompoundFC compound={assay.compound} />
                                </Section>
                            </>
                        );
                    })}
                </Container>
            ))}
            {_.isEmpty(idrs) && <p>{i18n.t("No IDRs found.")}</p>}
        </div>
    );
});

const styles = recordOfStyles({
    ul: { listStyleType: "none" },
    help: { marginLeft: 10 },
    title: {
        fontWeight: "bold",
        marginBottom: 15,
        color: "#123546",
    },
    section: {
        padding: 20,
    },
});

const ExternalLink: React.FC<ExternalLinkProps> = React.memo(({ href }) => {
    return (
        <a href={href} target="_blank" rel="noreferrer noopener">
            <IconButton>
                <OpenInNew />
            </IconButton>
        </a>
    );
});

//different <Li/> from "DetailsCell.tsx"
const ListItem: React.FC<ListItemProps> = React.memo(props => {
    const { name, value, children } = props;
    return (
        <>
            {(value || children) && (
                <Li>
                    <strong>{`${name}: `}</strong>
                    {value && <span>{value}</span>}
                    {children}
                </Li>
            )}
        </>
    );
});

const AssayFC: React.FC<AssayFCProps> = React.memo(({ assay, dataSource }) => (
    <>
        <ListItem name={"ID"} value={assay.id} />
        <ListItem name={"Type"} value={assay.type} />
        <ListItem name={"Type Term Accession"} value={assay.typeTermAccession} />
        <ListItem name={"Source"} value={dataSource} />
        <ListItem
            name={"Publication Title"}
            value={assay.publications.map(({ title }) => title).join(", ")}
        />
        <ListItem name={"Data DOI"} value={assay.dataDoi} />
    </>
));

const ScreenFC: React.FC<ScreenFCProps> = React.memo(({ screen }) => (
    <div>
        <ListItem name={"ID"} value={screen.id} />
        <ListItem name={"Type"} value={screen.type} />
        <ListItem name={"Type Term Accession"} value={screen.typeTermAccession} />
        <ListItem name={"Imaging Method"} value={screen.imagingMethod} />
        <ListItem
            name={"Imaging Method Term Accession"}
            value={screen.imagingMethodTermAccession}
        />
        <ListItem name={"Data DOI"}>
            <span>
                <a href={screen.doi} target="_blank" rel="noreferrer noopener">
                    {screen.doi}
                </a>
            </span>
        </ListItem>
        {screen.well && (
            <ListItem name={"Well"}>
                <span>
                    <a href={screen.well} target="_blank" rel="noreferrer noopener">
                        {screen.well}
                    </a>
                </span>
            </ListItem>
        )}
    </div>
));

const CompoundFC: React.FC<CompoundFCProps> = React.memo(({ compound }) => (
    <>
        <ListItem name={"Inhibition of cytopathicity"} value={compound.percentageInhibition} />
        <ListItem name={"Cytotoxicity (CC50)"} value={compound.cytotoxicity} />
        <ListItem name={"Dose-response (IC50)"} value={compound.doseResponse} />
        <ListItem
            name={"Cytotoxic Index (Selectivity Index, IC50/CC50)"}
            value={compound.cytotoxicIndex}
        />
    </>
));

const Section: React.FC<SectionProps> = React.memo(({ children, title }) => (
    <div>
        <Typography variant="h6" gutterBottom>
            {title}
        </Typography>
        <List>{children}</List>
    </div>
));

interface SectionProps {
    title: string;
}

interface ExternalLinkProps {
    href: string;
}

interface AssayFCProps {
    assay: Assay;
    dataSource: string;
}

interface ScreenFCProps {
    screen: Screen;
}

interface CompoundFCProps {
    compound: Compound;
}

export interface ListItemProps {
    name: string;
    value?: string;
}

const Container = styled.div`
    margin-top: 2rem;
    margin-bottom: 2rem;

    & div {
        margin-bottom: 1em;
    }

    & .MuiTypography-h6 {
        color: rgb(0, 188, 212);
        line-height: 1 !important;
    }
`;

const List = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
`;

const Li = styled.li`
    font-size: 0.875rem;
    font-family: "Roboto", "Helvetica", "Arial", sans-serif;
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: 0.00938em;
    span {
        color: ;
    }
`;
