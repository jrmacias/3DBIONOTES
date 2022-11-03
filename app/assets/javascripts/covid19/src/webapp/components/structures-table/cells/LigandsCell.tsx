import _ from "lodash";
import React from "react";
import styled from "styled-components";
import { BadgeLigands } from "../badge/BadgeLigands";
import { CellProps, styles } from "../Columns";
import { Link } from "../Link";
import { Wrapper } from "./Wrapper";
import i18n from "../../../../utils/i18n";

export const LigandsCell: React.FC<CellProps> = React.memo(props => {
    const { row, onClickDetails, onClickIDR, moreDetails } = props;

    const ligands = React.useMemo(() => {
        return row.ligands.map(ligand => {
            return {
                ...ligand,
                url: ligand.externalLink,
                tooltip: !_.isEmpty(
                    _.compact(_.values(_.pick(ligand, ["id", "name", "details", "imageLink"])))
                ) && (
                    <React.Fragment>
                        <div>
                            {i18n.t("ID")}: {ligand.id}
                        </div>
                        <div>
                            {i18n.t("Name")}: {ligand.name}
                        </div>

                        {ligand.details !== ligand.name && (
                            <div>
                                {i18n.t("Details")}: {ligand.details}
                            </div>
                        )}

                        {ligand.imageLink && (
                            <img alt={ligand.id} src={ligand.imageLink} style={styles.image} />
                        )}
                    </React.Fragment>
                ),
            };
        });
    }, [row.ligands]);

    return (
        <Wrapper
            onClickDetails={onClickDetails}
            moreDetails={moreDetails}
            row={row}
            field="ligands"
        >
            {ligands
                .sort((a, b) => (b.hasIDR ? (a.hasIDR ? 0 : 1) : -1))
                .map(ligand => {
                    return (
                        <LigandItem key={ligand.id} moreDetails={moreDetails}>
                            <Link
                                tooltip={ligand.tooltip}
                                url={ligand.url}
                                text={`${ligand.name} (${ligand.id})`}
                            >
                                {ligand.hasIDR && (
                                    <BadgeLigands
                                        ligand={ligand}
                                        onClick={onClickIDR}
                                        moreDetails={moreDetails}
                                    />
                                )}
                            </Link>
                        </LigandItem>
                    );
                })}
        </Wrapper>
    );
});

const LigandItem = styled.div<{ moreDetails?: boolean }>`
    li {
        text-align: left;
    }
    p {
        margin-top: 0;
        text-align: left;
        display: ${props => (props.moreDetails ? "inherit" : "inline-flex")};
        margin-right: ${props => (props.moreDetails ? "0" : "0.5em")};
    }
`;
